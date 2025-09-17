import { DeleteOutlined, EditOutlined, EyeOutlined, InboxOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons'
import { Button, Col, Descriptions, Divider, Drawer, Form, Input, InputNumber, message, Modal, Row, Select, Table, Tag } from 'antd'
import React, { useEffect, useState } from 'react'
import { itemsAPI, purchasesAPI, suppliersAPI, warehousesAPI } from '../services/api'
import { getItemDisplayName } from '../utils/itemNames'

interface PurchaseOrder {
  id: number
  order_no: string
  supplier_id: number
  supplier_name: string
  warehouse_id: number
  warehouse_name: string
  order_date: string
  expected_date: string
  total_amount: number
  total_cost: number
  status: string // pending, partial, received, cancelled
  remarks: string
  created_at: string
  updated_at: string
}

interface PurchaseOrderItem {
  id: number
  order_id: number
  item_id: number
  item_code: string
  item_name: string
  unit: string
  quantity: number
  unit_price: number
  received_quantity: number
  total_price: number
}

interface Supplier { id: number; name: string }
interface Item { id: number; code: string; name: string }
interface Warehouse { id: number; name: string }

const Purchases: React.FC = () => {
  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false)
  const [receiveModalVisible, setReceiveModalVisible] = useState(false)
  const [editingOrder, setEditingOrder] = useState<PurchaseOrder | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null)
  const [orderItems, setOrderItems] = useState<PurchaseOrderItem[]>([])

  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [searchFilters, setSearchFilters] = useState({ supplier_id: '', status: '', order_no: '' })

  const [form] = Form.useForm()
  const [receiveForm] = Form.useForm()

  useEffect(() => {
    fetchBase()
  }, [])

  useEffect(() => {
    fetchOrders()
  }, [pagination.current, pagination.pageSize, searchFilters])

  const fetchBase = async () => {
    try {
      const [sRes, wRes, iRes] = await Promise.all([
        suppliersAPI.getSuppliers({ pageSize: 1000 }),
        warehousesAPI.getWarehouses(),
        itemsAPI.getItems({ pageSize: 1000 })
      ])
      setSuppliers(sRes.data.data)
      setWarehouses(wRes.data)
      setItems(iRes.data.data)
    } catch (error) {
      console.error('获取基础数据失败:', error)
    }
  }

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const params = {
        page: pagination.current,
        pageSize: pagination.pageSize,
        ...Object.fromEntries(Object.entries(searchFilters).filter(([, v]) => v !== ''))
      }
      const res = await purchasesAPI.getPurchaseOrders(params)
      setOrders(res.data.data)
      setPagination(prev => ({ ...prev, total: res.data.total }))
    } catch (error) {
      message.error('获取采购订单失败')
    } finally { 
      setLoading(false) 
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const total = (values.items || []).reduce((s: number, it: any) => s + (Number(it.quantity || 0) * Number(it.unit_price || 0)), 0)
      const payload = { ...values, total_amount: total, order_date: values.order_date || new Date().toISOString().slice(0,10) }
      if (editingOrder) {
        await purchasesAPI.updatePurchaseOrder(editingOrder.id, payload)
        message.success('采购订单更新成功')
      } else {
        await purchasesAPI.createPurchaseOrder(payload)
        message.success('采购订单创建成功')
      }
      setModalVisible(false); setEditingOrder(null); form.resetFields(); fetchOrders()
    } catch (err: any) {
      if (err?.response) message.error(err.response.data?.error || '操作失败')
    }
  }

  const handleDelete = async (id: number) => {
    try { 
      await purchasesAPI.deletePurchaseOrder(id)
      message.success('删除成功')
      fetchOrders() 
    } catch (error) { 
      message.error('删除失败') 
    }
  }

  const openEdit = (record?: PurchaseOrder) => {
    setEditingOrder(record || null)
    if (record) {
      form.setFieldsValue({
        supplier_id: record.supplier_id,
        warehouse_id: record.warehouse_id,
        order_date: record.order_date,
        expected_date: record.expected_date,
        remarks: record.remarks,
        items: orderItems.map(x => ({ item_id: x.item_id, quantity: x.quantity, unit_price: x.unit_price }))
      })
    } else { form.resetFields() }
    setModalVisible(true)
  }

  const openDetail = async (id: number) => {
    try {
      const res = await purchasesAPI.getPurchaseOrderDetail(id)
      setSelectedOrder(res.data)
      setOrderItems(res.data.items || [])
      setDetailDrawerVisible(true)
    } catch { message.error('获取订单详情失败') }
  }

  const openReceive = async (record: PurchaseOrder) => {
    try {
      const res = await purchasesAPI.getPurchaseOrderDetail(record.id)
      const data = res.data
      setSelectedOrder(data)
      const itemsInit = (data.items || []).map((it: any) => ({ item_id: it.item_id, warehouse_id: record.warehouse_id, received_quantity: (it.quantity - (it.received_quantity || 0)) }))
      receiveForm.setFieldsValue({ items: itemsInit })
      setReceiveModalVisible(true)
    } catch { message.error('获取订单详情失败') }
  }

  const handleReceive = async () => {
    try {
      const values = await receiveForm.validateFields()
      await purchasesAPI.receivePurchase(selectedOrder!.id, values)
      message.success('入库成功')
      setReceiveModalVisible(false); receiveForm.resetFields(); fetchOrders(); if (selectedOrder) openDetail(selectedOrder.id)
    } catch (err: any) { message.error(err?.response?.data?.error || '入库失败') }
  }

  const statusColor = (s: string) => s==='pending'? 'orange' : s==='partial'? 'blue' : s==='received'? 'green':'red'
  const statusText = (s: string) => s==='pending'? '待收货' : s==='partial'? '部分入库' : s==='received'? '已完成':'已取消'

  const columns = [
    { title: '单号', dataIndex: 'order_no', key: 'order_no', width: 120, fixed: 'left' as const },
    { title: '供应商/仓库', key: 'supplier', width: 200, render: (r: PurchaseOrder) => (
      <div>
        <div style={{ fontWeight: 'bold' }}>{r.supplier_name}</div>
        <div style={{ color: '#666', fontSize: 12 }}>{r.warehouse_name}</div>
      </div>
    )},
    { title: '日期', dataIndex: 'order_date', key: 'order_date', width: 100, render: (d: string)=> new Date(d).toLocaleDateString() },
    { title: '金额/状态', key: 'amount', width: 140, render: (r: PurchaseOrder)=>(
      <div style={{ fontSize: 12 }}>
        <div style={{ fontWeight: 'bold' }}>总额: ¥{r.total_amount||0}</div>
        <Tag color={statusColor(r.status)} style={{ marginTop: 4 }}>{statusText(r.status)}</Tag>
      </div>
    )},
    { title: '操作', key: 'action', width: 220, fixed: 'right' as const, render: (r: PurchaseOrder)=>(
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        <Button type="link" size="small" icon={<EyeOutlined />} onClick={()=>openDetail(r.id)}>详情</Button>
        {r.status!=='received' && r.status!=='cancelled' && (
          <>
            <Button type="link" size="small" icon={<EditOutlined />} onClick={()=>openEdit(r)}>编辑</Button>
            <Button type="link" size="small" icon={<InboxOutlined />} onClick={()=>openReceive(r)}>收货</Button>
          </>
        )}
        <Button type="link" danger size="small" icon={<DeleteOutlined />} onClick={()=>Modal.confirm({ title:'确认删除', onOk:()=>handleDelete(r.id) })}>删除</Button>
      </div>
    )},
  ]

  return (
    <div>
      <div className="page-header">
        <h1>采购管理</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={()=>openEdit()}>新增采购单</Button>
      </div>

      {/* 筛选 */}
      <div className="form-container" style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col span={6}>
            <Input placeholder="搜索单号" allowClear value={searchFilters.order_no} onChange={(e)=>setSearchFilters({ ...searchFilters, order_no: e.target.value })} prefix={<SearchOutlined />} />
          </Col>
          <Col span={5}>
            <Select placeholder="供应商" allowClear style={{ width: '100%' }} value={searchFilters.supplier_id} onChange={(v)=>setSearchFilters({ ...searchFilters, supplier_id: v||'' })} showSearch filterOption={(i,o)=>String(o?.children||'').toLowerCase().includes(i.toLowerCase())}>
              {suppliers.map(s=> (<Select.Option key={s.id} value={s.id}>{s.name}</Select.Option>))}
            </Select>
          </Col>
          <Col span={5}>
            <Select placeholder="状态" allowClear style={{ width: '100%' }} value={searchFilters.status} onChange={(v)=>setSearchFilters({ ...searchFilters, status: v||'' })}>
              <Select.Option value="pending">待收货</Select.Option>
              <Select.Option value="partial">部分入库</Select.Option>
              <Select.Option value="received">已完成</Select.Option>
              <Select.Option value="cancelled">已取消</Select.Option>
            </Select>
          </Col>
          <Col span={3}><Button type="primary" icon={<SearchOutlined />} onClick={fetchOrders}>搜索</Button></Col>
        </Row>
      </div>

      {/* 列表 */}
      <div className="table-container">
        <Table
          columns={columns}
          dataSource={orders}
          rowKey="id"
          loading={loading}
          pagination={{ current: pagination.current, pageSize: pagination.pageSize, total: pagination.total, showSizeChanger: true, showQuickJumper: true, showTotal:(t,r)=>`第 ${r[0]}-${r[1]} 条/共 ${t} 条` }}
          onChange={(p:any)=> setPagination(prev=>({ ...prev, current: p.current, pageSize: p.pageSize }))}
          scroll={{ x: 1000 }}
          size="small"
        />
      </div>

      {/* 新增/编辑 */}
      <Modal title={editingOrder? '编辑采购订单':'新增采购订单'} open={modalVisible} onOk={handleSubmit} onCancel={()=>{ setModalVisible(false); setEditingOrder(null); form.resetFields() }} width={820} okText="确定" cancelText="取消">
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="supplier_id" label="供应商" rules={[{ required: true, message: '请选择供应商' }]}>
                <Select placeholder="请选择供应商" showSearch filterOption={(i,o)=>String(o?.children||'').toLowerCase().includes(i.toLowerCase())}>
                  {suppliers.map(s=> (<Select.Option key={s.id} value={s.id}>{s.name}</Select.Option>))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="warehouse_id" label="入库仓库" rules={[{ required: true, message: '请选择入库仓库' }]}>
                <Select placeholder="请选择入库仓库">
                  {warehouses.map(w=> (<Select.Option key={w.id} value={w.id}>{w.name}</Select.Option>))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="order_date" label="下单日期" rules={[{ required: true, message: '请选择下单日期' }]}>
                <Input type="date" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="expected_date" label="预计到货日期">
                <Input type="date" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="订单明细">
            <Form.List name="items">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <Row key={key} gutter={8} align="middle" style={{ marginBottom: 8 }}>
                      <Col span={9}>
                        <Form.Item {...restField} name={[name, 'item_id']} rules={[{ required: true, message: '请选择货品' }]}>
                          <Select placeholder="选择货品" showSearch filterOption={(i,o)=>String(o?.children||'').toLowerCase().includes(i.toLowerCase())}>
                            {items.map(it=> (
                              <Select.Option key={it.id} value={it.id}>
                                <div>
                                  <div style={{ fontWeight: 600 }}>{getItemDisplayName(it.code, it.name, 'en')}</div>
                                  {it.name && it.name !== getItemDisplayName(it.code, it.name, 'en') && (
                                    <div style={{ color:'#888', fontSize:12 }}>{it.name}</div>
                                  )}
                                </div>
                              </Select.Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={5}>
                        <Form.Item {...restField} name={[name, 'quantity']} rules={[{ required: true, message: '请输入数量' }]}>
                          <InputNumber placeholder="数量" min={1} style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item {...restField} name={[name, 'unit_price']} rules={[{ required: true, message: '请输入单价' }]}>
                          <InputNumber placeholder="单价" min={0} precision={2} style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>
                      <Col span={2}>
                        <Button type="link" danger onClick={()=>remove(name)} icon={<DeleteOutlined />} />
                      </Col>
                    </Row>
                  ))}
                  <Button type="dashed" onClick={()=>add()} block icon={<PlusOutlined />}>添加商品</Button>
                </>
              )}
            </Form.List>
          </Form.Item>

          <Form.Item name="remarks" label="备注"><Input.TextArea rows={3} placeholder="请输入备注信息" /></Form.Item>
        </Form>
      </Modal>

      {/* 详情 */}
      <Drawer title="采购订单详情" open={detailDrawerVisible} onClose={()=>setDetailDrawerVisible(false)} width={600}>
        {selectedOrder && (
          <div>
            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item label="单号">{selectedOrder.order_no}</Descriptions.Item>
              <Descriptions.Item label="供应商">{selectedOrder.supplier_name}</Descriptions.Item>
              <Descriptions.Item label="入库仓库">{selectedOrder.warehouse_name}</Descriptions.Item>
              <Descriptions.Item label="下单日期">{selectedOrder.order_date}</Descriptions.Item>
              <Descriptions.Item label="预计到货">{selectedOrder.expected_date || '未设置'}</Descriptions.Item>
              <Descriptions.Item label="订单总额">¥{selectedOrder.total_amount}</Descriptions.Item>
              <Descriptions.Item label="订单状态"><Tag color={statusColor(selectedOrder.status)}>{statusText(selectedOrder.status)}</Tag></Descriptions.Item>
              <Descriptions.Item label="备注">{selectedOrder.remarks || '无'}</Descriptions.Item>
            </Descriptions>

            <Divider>订单明细</Divider>
            <Table size="small" rowKey="id" pagination={false} dataSource={orderItems} columns={[
              { title: '货品', key:'item', render:(r: PurchaseOrderItem)=> `${r.item_code} - ${r.item_name}` },
              { title: '数量', dataIndex:'quantity', align:'right' as const, render:(v:number, r)=> `${v} ${r.unit}` },
              { title: '单价', dataIndex:'unit_price', align:'right' as const, render:(v:number)=> `¥${v}` },
              { title: '小计', dataIndex:'total_price', align:'right' as const, render:(v:number)=> `¥${v}` },
              { title: '已入库', dataIndex:'received_quantity', align:'right' as const, render:(v:number, r)=> `${v||0} ${r.unit}` },
            ]} />
          </div>
        )}
      </Drawer>

      {/* 收货入库 */}
      <Modal title="采购收货入库" open={receiveModalVisible} onOk={handleReceive} onCancel={()=>{ setReceiveModalVisible(false); receiveForm.resetFields() }} width={720} okText="确认入库" cancelText="取消">
        <Form form={receiveForm} layout="vertical">
          <Form.List name="items">
            {(fields) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Row key={key} gutter={8} align="middle" style={{ marginBottom: 8 }}>
                    <Col span={10}>
                      <Form.Item {...restField} name={[name, 'item_id']} hidden><Input /></Form.Item>
                      <Form.Item {...restField} name={[name, 'warehouse_id']} hidden><Input /></Form.Item>
                      <div style={{ lineHeight: '32px' }}>{orderItems[name]?.item_name || '货品'}</div>
                    </Col>
                    <Col span={6}>
                      <div style={{ lineHeight: '32px', textAlign: 'center' }}>待收: {(orderItems[name]?.quantity||0) - (orderItems[name]?.received_quantity||0)}</div>
                    </Col>
                    <Col span={8}>
                      <Form.Item {...restField} name={[name, 'received_quantity']} rules={[{ required: true, message: '请输入入库数量' }]}>
                        <InputNumber placeholder="入库数量" min={0} max={(orderItems[name]?.quantity||0) - (orderItems[name]?.received_quantity||0)} style={{ width:'100%' }} />
                      </Form.Item>
                    </Col>
                  </Row>
                ))}
              </>
            )}
          </Form.List>
        </Form>
      </Modal>
    </div>
  )
}

export default Purchases 