import { CreditCardOutlined, DesktopOutlined, FileTextOutlined, SearchOutlined, UserOutlined } from '@ant-design/icons'
import { Button, Card, Col, Form, Input, InputNumber, message, Modal, Radio, Row, Select, Space, Table } from 'antd'
import React, { useEffect, useMemo, useState } from 'react'
import { customersAPI, itemsAPI, paymentsAPI, printAPI, salesAPI } from '../services/api'
import { formatCurrencyZAR } from '../utils/currency'
import { getItemDisplayName, Lang } from '../utils/itemNames'

interface Item { id: number; code: string; name: string; en_name?: string; unit: string; sale_price: number }
interface Customer { id: number; name: string }

interface CartLine {
  key: string
  item_id: number
  code: string
  name: string
  unit: string
  price: number
  qty: number
  discount: number // 0-100, 百分比
  amount: number
}

type OrderMode = 'pos' | 'company'

const POS: React.FC = () => {
  const [items, setItems] = useState<Item[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [cart, setCart] = useState<CartLine[]>([])
  const [payModal, setPayModal] = useState(false)
  const [payForm] = Form.useForm()
  const [basicForm] = Form.useForm()
  const [companyForm] = Form.useForm()
  // const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<OrderMode>('pos')
  
  // 结算选项状态
  const [discountAmount, setDiscountAmount] = useState(0)
  const [roundAmount, setRoundAmount] = useState(0)
  const [includeTax, setIncludeTax] = useState(true)

  useEffect(()=>{ fetchBase() }, [])

  const fetchBase = async () => {
    try {
      const [iRes, cRes] = await Promise.all([
        itemsAPI.getItems({ pageSize: 1000 }),
        customersAPI.getCustomers({ pageSize: 1000 })
      ])
      setItems(iRes.data.data)
      setCustomers(cRes.data.data)
    } catch { /* ignore */ }
  }

  // 将购物车状态投送给客户屏幕（通过localStorage事件）
  useEffect(()=>{
    const state = {
      items: cart.map(l=>({ name: l.name, qty: l.qty, price: l.price, amount: l.amount })),
      total: Number(totalAmount.toFixed(2)),
      time: new Date().toLocaleString(),
    }
    try { localStorage.setItem('pos_display_state', JSON.stringify(state)) } catch {}
  }, [cart])

  const addItem = (id: number) => {
    const it = items.find(i=>i.id===id)
    if (!it) return
    const existed = cart.find(c=>c.item_id===id)
    if (existed) {
      updateQty(existed.key, existed.qty + 1)
      return
    }
    const line: CartLine = {
      key: `${id}-${Date.now()}`,
      item_id: it.id,
      code: it.code,
      name: it.name,
      unit: it.unit,
      price: it.sale_price,
      qty: 1,
      discount: 0,
      amount: it.sale_price,
    }
    setCart(prev=>[...prev, line])
  }

  const removeLine = (key: string) => setCart(prev=> prev.filter(l=>l.key!==key))
  const updateQty = (key: string, qty: number) => { setCart(prev=> prev.map(l=> l.key===key ? { ...l, qty, amount: (l.price * qty * (100 - l.discount))/100 } : l)) }
  const updateDiscount = (key: string, discount: number) => { setCart(prev=> prev.map(l=> l.key===key ? { ...l, discount, amount: (l.price * l.qty * (100 - discount))/100 } : l)) }
  const updatePrice = (key: string, price: number) => { setCart(prev=> prev.map(l=> l.key===key ? { ...l, price, amount: (price * l.qty * (100 - l.discount))/100 } : l)) }

  const totalQty = useMemo(()=> cart.reduce((s,l)=> s + l.qty, 0), [cart])
  const totalAmount = useMemo(()=> cart.reduce((s,l)=> s + l.amount, 0), [cart])
  
  // 税额和最终金额计算
  const taxRate = 0.15 // 南非增值税率15%
  const netAmount = useMemo(() => {
    if (!includeTax) return totalAmount
    return totalAmount / (1 + taxRate)
  }, [totalAmount, includeTax])
  
  const taxAmount = useMemo(() => {
    if (!includeTax) return 0
    return totalAmount - netAmount
  }, [totalAmount, netAmount, includeTax])
  
  const finalAmount = useMemo(() => {
    return Math.max(0, totalAmount - discountAmount + roundAmount)
  }, [totalAmount, discountAmount, roundAmount])

  const columns = [
    { title: '编码', dataIndex: 'code', key: 'code', width: 100 },
    { 
      title: '品名', 
      dataIndex: 'name', 
      key: 'name', 
      width: 250,
      render: (_: any, r: CartLine)=> (
        <div style={{ maxWidth: '240px' }}>
          <div style={{ 
            fontWeight: 600, 
            fontSize: '14px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {getItemDisplayName(r.code, r.name, 'en')}
          </div>
          {r.name && r.name !== getItemDisplayName(r.code, r.name, 'en') && (
            <div style={{ 
              color: '#888', 
              fontSize: 12,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {r.name}
            </div>
          )}
        </div>
      ) 
    },
    { title: '单价', key: 'price', width: 120, align: 'right' as const, render: (_: any, r: CartLine)=> (
      <InputNumber min={0} value={r.price} style={{ width: '100%' }} onChange={(v)=>updatePrice(r.key, Number(v||0))} />
    )},
    { title: '数量', key: 'qty', width: 120, align: 'right' as const, render: (_: any, r: CartLine)=> (
      <InputNumber min={1} value={r.qty} style={{ width: '100%' }} onChange={(v)=>updateQty(r.key, Number(v||1))} />
    )},
    { title: '折扣(%)', key: 'discount', width: 120, align: 'right' as const, render: (_: any, r: CartLine)=> (
      <InputNumber min={0} max={100} value={r.discount} style={{ width: '100%' }} onChange={(v)=>updateDiscount(r.key, Number(v||0))} />
    )},
    { title: '小计', key: 'amount', width: 140, align: 'right' as const, render: (_: any, r: CartLine)=> formatCurrencyZAR(r.amount) },
    { title: '操作', key: 'action', width: 90, fixed: 'right' as const, render: (_: any, r: CartLine)=> (
      <Button danger type="link" onClick={()=>removeLine(r.key)}>删除</Button>
    )},
  ]

  const handlePay = async () => {
    if (cart.length===0) { message.warning('请先添加商品'); return }
    setPayModal(true)
    payForm.setFieldsValue({ 
      pay_method: 'cash', 
      received: Number(finalAmount.toFixed(2)), 
      final_amount: Number(finalAmount.toFixed(2)),
      change: 0,
      discount_amount: discountAmount,
      round_amount: roundAmount,
      include_tax: includeTax
    })
  }

  const onPayValuesChange = (_: any, values: any) => {
    const received = Number(values.received || 0)
    const change = received - finalAmount
    payForm.setFieldsValue({ 
      final_amount: Number(finalAmount.toFixed(2)),
      change: Number(change.toFixed(2)) 
    })
  }

  const submitSale = async () => {
    try {
      const values = await payForm.validateFields()
      const customer_id = basicForm.getFieldValue('customer_id') || null
      const itemsPayload = cart.map(l=> ({ item_id: l.item_id, quantity: l.qty, unit_price: l.price }))
      
      // 使用状态中的值，而不是表单值
      const discount_amount = discountAmount
      const round_amount = roundAmount
      const final_amount_value = finalAmount
      
      const payload = {
        customer_id,
        warehouse_id: 1,
        order_date: new Date().toISOString().slice(0,10),
        items: itemsPayload,
        total_amount: Number(totalAmount.toFixed(2)),
        discount_amount,
        round_amount,
        payment_type: values.payment_type || 'full',
        payment_info: {
          payment_method: values.pay_method,
          received_amount: Number(values.received || final_amount_value),
          change_amount: Number(values.change || 0)
        },
        remarks: `POS开单 - ${values.pay_method} 收款 R ${values.received || final_amount_value}`
      }
      
      const response = await salesAPI.createSalesOrder(payload)
      message.success('开单并支付成功')
      
      // 如果是分期付款，创建分期计划
      if (values.payment_type === 'installment' && values.installments > 1) {
        await paymentsAPI.createInstallmentPlan({
          order_id: response.data.id,
          total_amount: final_amount_value,
          installments: values.installments,
          first_payment: Number(values.first_payment || 0)
        })
        message.success('分期付款计划创建成功')
      }
      
      // 自动弹出打印界面
      if (values.auto_print !== false) {
        await printReceipt(response.data.id, values.print_format || '80mm', values.include_tax !== false)
      }
      
      setCart([])
      setPayModal(false)
      payForm.resetFields()
      
      // 重置结算选项
      setDiscountAmount(0)
      setRoundAmount(0)
      setIncludeTax(true)
    } catch (e:any) {
      message.error(e?.response?.data?.error || '开单失败')
    }
  }

  const openCustomerScreen = () => {
    window.open('/pos-display', 'pos-display', 'width=800,height=600')
  }

  const printReceipt = async (orderId: number, format: string = '80mm', includeTax: boolean = true) => {
    try {
      const receiptResponse = await printAPI.getReceiptData(orderId, { 
        format, 
        include_tax: includeTax 
      })
      const htmlResponse = await printAPI.generatePrintHTML(receiptResponse.data)
      
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(htmlResponse.data.html)
        printWindow.document.close()
      }
    } catch (error) {
      message.error('打印失败')
    }
  }

  const exportContract = async () => {
    if (cart.length===0) { message.warning('请先添加商品'); return }
    try {
      const values = await companyForm.validateFields()
      const lang: Lang = values.lang || 'zh'
      const t = (k: string) => {
        const zh: Record<string,string> = {
          title: '销售合同（报价/订单）',
          company: '公司名称', contact: '联系人', phone: '电话', address: '地址',
          terms: '付款条件', delivery: '交付日期', issue: '制单日期',
          code: '编码', name: '品名', price: '单价(R)', qty: '数量', disc: '折扣(%)', subtotal: '小计(R)',
          total: '合计', remark: '备注：本合同一式两份，双方各执一份。价格以南非兰特（ZAR）结算。'
        }
        const en: Record<string,string> = {
          title: 'Sales Contract (Quotation / Order)',
          company: 'Company', contact: 'Contact', phone: 'Phone', address: 'Address',
          terms: 'Payment Terms', delivery: 'Delivery Date', issue: 'Issue Date',
          code: 'Code', name: 'Item', price: 'Unit Price (R)', qty: 'Qty', disc: 'Discount(%)', subtotal: 'Subtotal (R)',
          total: 'Total', remark: 'Note: This contract is made in duplicate. All prices are in South African Rand (ZAR).'
        }
        return (lang==='en'? en: zh)[k]
      }
      const html = `<!doctype html><html><head><meta charset="utf-8" /><title>销售合同</title>
      <style>body{font-family:Arial,Helvetica,Helvetica Neue,Microsoft YaHei; padding:24px;} h2{margin:0 0 12px} table{width:100%;border-collapse:collapse} th,td{border:1px solid #ddd;padding:8px;font-size:12px} th{background:#f5f5f5} .tr{text-align:right} .mt{margin-top:12px}</style>
      </head><body>
      <h2>${t('title')}</h2>
      <div>${t('company')}：${values.company_name || ''}</div>
      <div>${t('contact')}：${values.contact || ''}　${t('phone')}：${values.phone || ''}</div>
      <div>${t('address')}：${values.address || ''}</div>
      <div class="mt">${t('terms')}：${values.payment_terms || (lang==='en'?'Cash':'现金')}　${t('delivery')}：${values.delivery_date || ''}</div>
      <div class="mt">${t('issue')}：${new Date().toLocaleDateString()}</div>
      <table class="mt"><thead><tr><th>${t('code')}</th><th>${t('name')}</th><th>${t('price')}</th><th>${t('qty')}</th><th>${t('disc')}</th><th>${t('subtotal')}</th></tr></thead><tbody>
      ${cart.map(l=>`<tr><td>${l.code}</td><td>${getItemDisplayName(l.code, l.name, lang)}</td><td class='tr'>${(l.price).toFixed(2)}</td><td class='tr'>${l.qty}</td><td class='tr'>${l.discount}</td><td class='tr'>${l.amount.toFixed(2)}</td></tr>`).join('')}
      </tbody></table>
      <h3 class="mt" style="text-align:right">${t('total')}：R ${totalAmount.toFixed(2)}</h3>
      <p class="mt">${t('remark')}</p>
      <script>window.print()</script>
      </body></html>`
      const w = window.open('', '_blank')
      if (w) { w.document.write(html); w.document.close() }
    } catch { /* 校验失败 */ }
  }

  return (
    <div>
      <div className="page-header" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>
        <h1>POS 开单（南非兰特）</h1>
        <Space wrap>
          <Radio.Group value={mode} onChange={(e)=>setMode(e.target.value)}>
            <Radio.Button value="pos">门店POS</Radio.Button>
            <Radio.Button value="company">公司开单</Radio.Button>
          </Radio.Group>
          <Button icon={<DesktopOutlined />} onClick={openCustomerScreen}>打开客户屏幕</Button>
        </Space>
      </div>

      <Space direction="vertical" style={{ width:'100%' }} size={12}>
        <Card size="small">
          <Space wrap>
            <Form form={basicForm} layout="inline">
              <Form.Item name="customer_id" label="客户">
                <Select allowClear placeholder="选择客户(可空)" style={{ width: 260 }} showSearch filterOption={(i,o)=>String(o?.children||'').toLowerCase().includes(i.toLowerCase())} suffixIcon={<UserOutlined />}>
                  {customers.map(c=> (<Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>))}
                </Select>
              </Form.Item>
            </Form>
            <Select
              showSearch
              placeholder="快速搜索商品并添加"
              style={{ width: 420 }}
              filterOption={(input, option): boolean => {
                const item = items.find(it => it.id === option?.value)
                if (!item) return false
                const searchText = input.toLowerCase()
                return (
                  item.code.toLowerCase().includes(searchText) ||
                  item.name.toLowerCase().includes(searchText) ||
                  (item.en_name && item.en_name.toLowerCase().includes(searchText))
                )
              }}
              onSelect={(val)=> addItem(Number(val))}
              suffixIcon={<SearchOutlined />}
              dropdownStyle={{ 
                maxWidth: '500px',
                maxHeight: '400px'
              }}
              optionLabelProp="label"
            >
              {items.map(it=> (
                <Select.Option 
                  key={it.id} 
                  value={it.id}
                  label={`${it.code} - ${getItemDisplayName(it.code, it.name, 'en')}`}
                >
                  <div className="pos-product-option">
                    <div className="pos-product-name">
                      {it.code} - {getItemDisplayName(it.code, it.name, 'en')}
                    </div>
                    {it.name && it.name !== getItemDisplayName(it.code, it.name, 'en') && (
                      <div className="pos-product-name-secondary">
                        {it.name}
                      </div>
                    )}
                    <div className="pos-product-price">
                      {formatCurrencyZAR(it.sale_price)}
                    </div>
                  </div>
                </Select.Option>
              ))}
            </Select>
          </Space>
        </Card>

        {mode==='company' && (
          <Card size="small" title="公司开单信息">
            <Form form={companyForm} layout="inline" style={{ rowGap:8 }}>
              <Form.Item name="lang" label="合同语言" initialValue="zh">
                <Select style={{ width: 160 }}>
                  <Select.Option value="zh">中文</Select.Option>
                  <Select.Option value="en">English</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item name="company_name" label="公司名称" rules={[{ required:true, message:'请输入公司名称' }]}>
                <Input placeholder="请输入公司名称" style={{ width: 260 }} />
              </Form.Item>
              <Form.Item name="contact" label="联系人">
                <Input placeholder="联系人" style={{ width: 160 }} />
              </Form.Item>
              <Form.Item name="phone" label="电话">
                <Input placeholder="电话" style={{ width: 160 }} />
              </Form.Item>
              <Form.Item name="address" label="地址" style={{ flex:1 }}>
                <Input placeholder="详细地址" style={{ width: 320 }} />
              </Form.Item>
              <Form.Item name="payment_terms" label="付款条件">
                <Select placeholder="选择" style={{ width: 160 }}>
                  <Select.Option value="现金">现金</Select.Option>
                  <Select.Option value="月结30天">月结30天</Select.Option>
                  <Select.Option value="月结60天">月结60天</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item name="delivery_date" label="交付日期">
                <Input type="date" />
              </Form.Item>
            </Form>
          </Card>
        )}

        <div className="table-container">
          <Table 
            columns={columns} 
            dataSource={cart} 
            rowKey="key" 
            pagination={false} 
            size="small" 
            scroll={{ x: 800, y: 300 }} 
            className="pos-cart-table"
            locale={{ emptyText: '购物车为空，请添加商品' }}
          />
        </div>

        {/* 结算选项区域 - 添加商品后立即可用 */}
        {cart.length > 0 && (
          <Card size="small" title="结算选项" className="settlement-options" style={{ marginTop: 16 }}>
            <Row gutter={16}>
              <Col span={6}>
                <div style={{ marginBottom: 8 }}>
                  <label style={{ fontSize: 12, color: '#666' }}>折扣金额 (R)</label>
                  <InputNumber
                    value={discountAmount}
                    onChange={(value) => setDiscountAmount(value || 0)}
                    min={0}
                    max={totalAmount}
                    precision={2}
                    style={{ width: '100%' }}
                    placeholder="0.00"
                  />
                </div>
              </Col>
              <Col span={6}>
                <div style={{ marginBottom: 8 }}>
                  <label style={{ fontSize: 12, color: '#666' }}>抹零金额 (R)</label>
                  <InputNumber
                    value={roundAmount}
                    onChange={(value) => setRoundAmount(value || 0)}
                    min={-10}
                    max={10}
                    step={0.01}
                    precision={2}
                    style={{ width: '100%' }}
                    placeholder="0.00"
                  />
                </div>
              </Col>
              <Col span={6}>
                <div style={{ marginBottom: 8 }}>
                  <label style={{ fontSize: 12, color: '#666' }}>含税计算</label>
                  <Select
                    value={includeTax}
                    onChange={setIncludeTax}
                    style={{ width: '100%' }}
                  >
                    <Select.Option value={true}>含税 (15%)</Select.Option>
                    <Select.Option value={false}>不含税</Select.Option>
                  </Select>
                </div>
              </Col>
              <Col span={6}>
                <div style={{ marginBottom: 8 }}>
                  <label style={{ fontSize: 12, color: '#666' }}>最终金额 (R)</label>
                  <div style={{
                    padding: '4px 11px',
                    border: '1px solid #d9d9d9',
                    borderRadius: '6px',
                    backgroundColor: '#f5f5f5',
                    textAlign: 'center',
                    fontWeight: 'bold',
                    color: '#d4380d',
                    fontSize: '16px'
                  }}>
                    {formatCurrencyZAR(finalAmount)}
                  </div>
                </div>
              </Col>
            </Row>

            {/* 税额明细显示 */}
            {includeTax && totalAmount > 0 && (
              <div style={{ 
                marginTop: 8, 
                padding: 8, 
                backgroundColor: '#f0f9ff', 
                border: '1px solid #bae7ff',
                borderRadius: 4,
                fontSize: 12
              }}>
                <Row gutter={16}>
                  <Col span={8}>
                    <span style={{ color: '#666' }}>净额: </span>
                    <span style={{ fontWeight: 500 }}>{formatCurrencyZAR(netAmount)}</span>
                  </Col>
                  <Col span={8}>
                    <span style={{ color: '#666' }}>增值税(15%): </span>
                    <span style={{ fontWeight: 500 }}>{formatCurrencyZAR(taxAmount)}</span>
                  </Col>
                  <Col span={8}>
                    <span style={{ color: '#666' }}>含税总额: </span>
                    <span style={{ fontWeight: 500 }}>{formatCurrencyZAR(totalAmount)}</span>
                  </Col>
                </Row>
              </div>
            )}
          </Card>
        )}
      </Space>

      {/* 右下角固定结算栏 */}
      <div style={{ position:'fixed', right:24, bottom:24, zIndex: 1000 }}>
        <Card size="small" className="fixed-checkout-panel">
          <Space direction="vertical" style={{ minWidth: 320 }}>
            <div style={{ display:'flex', justifyContent:'space-between' }}>
              <span>合计数量：</span><b>{totalQty}</b>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between' }}>
              <span>商品总额：</span><b>{formatCurrencyZAR(totalAmount)}</b>
            </div>
            {(discountAmount > 0 || roundAmount !== 0) && (
              <>
                {discountAmount > 0 && (
                  <div style={{ display:'flex', justifyContent:'space-between', color: '#52c41a' }}>
                    <span>折扣：</span><b>-{formatCurrencyZAR(discountAmount)}</b>
                  </div>
                )}
                {roundAmount !== 0 && (
                  <div style={{ display:'flex', justifyContent:'space-between', color: roundAmount > 0 ? '#fa8c16' : '#52c41a' }}>
                    <span>抹零：</span><b>{roundAmount > 0 ? '+' : ''}{formatCurrencyZAR(roundAmount)}</b>
                  </div>
                )}
              </>
            )}
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:18, borderTop: '1px solid #f0f0f0', paddingTop: 8 }}>
              <span>应收金额：</span><b style={{ color:'#d4380d' }}>{formatCurrencyZAR(finalAmount)}</b>
            </div>
            {mode==='pos' ? (
              <Button 
                type="primary" 
                icon={<CreditCardOutlined />} 
                onClick={handlePay} 
                block
                disabled={cart.length === 0}
              >
                立即结算
              </Button>
            ) : (
              <Button 
                icon={<FileTextOutlined />} 
                onClick={exportContract} 
                block
                disabled={cart.length === 0}
              >
                导出合同
              </Button>
            )}
          </Space>
        </Card>
      </div>

      {/* 收银弹窗 */}
      <Modal title="收银结算 (ZAR)" open={payModal} onOk={submitSale} onCancel={()=>{ setPayModal(false); payForm.resetFields() }} okText="确认收款并开单" cancelText="取消" width={600}>
        <Form form={payForm} layout="vertical" onValuesChange={onPayValuesChange}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="payment_type" label="付款类型" initialValue="full">
                <Select>
                  <Select.Option value="full">全额付款</Select.Option>
                  <Select.Option value="installment">分期付款</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="pay_method" label="支付方式" rules={[{ required: true, message: '请选择支付方式' }]}>
                <Select placeholder="请选择">
                  <Select.Option value="cash">现金 (Cash)</Select.Option>
                  <Select.Option value="card">刷卡 (Card)</Select.Option>
                  <Select.Option value="transfer">转账 (EFT)</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="discount_amount" label="折扣金额 (R)" initialValue={0}>
                <InputNumber min={0} max={totalAmount} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="round_amount" label="抹零金额 (R)" initialValue={0}>
                <InputNumber min={-10} max={10} step={0.01} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="final_amount" label="应收金额 (R)">
                <InputNumber disabled style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item dependencies={['payment_type']} noStyle>
            {({ getFieldValue }) => {
              const paymentType = getFieldValue('payment_type')
              return paymentType === 'installment' ? (
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name="installments" label="分期数" rules={[{ required: true, message: '请选择分期数' }]}>
                      <Select placeholder="请选择">
                        <Select.Option value={2}>2期</Select.Option>
                        <Select.Option value={3}>3期</Select.Option>
                        <Select.Option value={6}>6期</Select.Option>
                        <Select.Option value={12}>12期</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="first_payment" label="首付金额 (R)" initialValue={0}>
                      <InputNumber min={0} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                </Row>
              ) : (
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name="received" label="实收金额 (R)" rules={[{ required: true, message: '请输入实收金额' }]}>
                      <InputNumber min={0} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="change" label="找零 (R)">
                      <InputNumber disabled style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                </Row>
              )
            }}
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="auto_print" label="自动打印" initialValue={true}>
                <Select>
                  <Select.Option value={true}>是</Select.Option>
                  <Select.Option value={false}>否</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="print_format" label="打印格式" initialValue="80mm">
                <Select>
                  <Select.Option value="80mm">80mm小票</Select.Option>
                  <Select.Option value="A4">A4发票</Select.Option>
                  <Select.Option value="A5">A5发票</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="include_tax" label="含税打印" initialValue={true}>
                <Select>
                  <Select.Option value={true}>含税</Select.Option>
                  <Select.Option value={false}>不含税</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  )
}

export default POS 