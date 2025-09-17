import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  SearchOutlined,
  TruckOutlined
} from '@ant-design/icons'
import {
  Alert, Button,
  Col, Descriptions, Divider, Drawer, Form, Input,
  InputNumber, message, Modal, Row, Select,
  Table, Tag
} from 'antd'
import React, { useEffect, useState } from 'react'
import { customersAPI, inventoryAPI, itemsAPI, salesAPI, warehousesAPI } from '../services/api'

interface SalesOrder {
  id: number
  order_no: string
  customer_id: number
  customer_name: string
  warehouse_id: number
  warehouse_name: string
  order_date: string
  delivery_date: string
  total_amount: number
  total_cost: number
  gross_profit: number
  profit_margin: number
  status: string
  remarks: string
  created_at: string
  updated_at: string
}

interface SalesOrderItem {
  id: number
  order_id: number
  item_id: number
  item_code: string
  item_name: string
  unit: string
  quantity: number
  unit_price: number
  unit_cost: number
  total_price: number
  total_cost: number
  delivered_quantity: number
}

interface Customer {
  id: number
  code: string
  name: string
  customer_type: string
  contact_person: string
  phone: string
}

interface Item {
  id: number
  code: string
  name: string
  unit: string
  sale_price: number
  purchase_price: number
}

interface Warehouse {
  id: number
  code: string
  name: string
}

const Sales: React.FC = () => {
  const [orders, setOrders] = useState<SalesOrder[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false)
  const [deliverModalVisible, setDeliverModalVisible] = useState(false)
  const [editingOrder, setEditingOrder] = useState<SalesOrder | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null)
  const [orderItems, setOrderItems] = useState<SalesOrderItem[]>([])
  
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  })

  const [searchFilters, setSearchFilters] = useState({
    status: '',
    customer_id: '',
    order_no: ''
  })

  const [form] = Form.useForm()
  const [deliverForm] = Form.useForm()

  useEffect(() => {
    fetchOrders()
    fetchCustomers()
    fetchWarehouses()
    fetchItems()
  }, [pagination.current, pagination.pageSize, searchFilters])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const params = {
        page: pagination.current,
        pageSize: pagination.pageSize,
        ...Object.fromEntries(Object.entries(searchFilters).filter(([key, v]) => v !== ''))
      }
      const response = await salesAPI.getSalesOrders(params)
      setOrders(response.data.data)
      setPagination(prev => ({ ...prev, total: response.data.total }))
    } catch (error) {
      message.error('获取销售订单失败')
    } finally {
      setLoading(false)
    }
  }

  const fetchCustomers = async () => {
    try {
      const response = await customersAPI.getCustomers({ pageSize: 1000 })
      setCustomers(response.data.data)
    } catch (error) {
      message.error('获取客户列表失败')
    }
  }

  const fetchWarehouses = async () => {
    try {
      const response = await warehousesAPI.getWarehouses()
      setWarehouses(response.data)
    } catch (error) {
      message.error('获取仓库列表失败')
    }
  }

  const fetchItems = async () => {
    try {
      const response = await itemsAPI.getItems({ pageSize: 1000 })
      setItems(response.data.data)
    } catch (error) {
      message.error('获取货品列表失败')
    }
  }

  const fetchOrderDetail = async (orderId: number) => {
    try {
      const response = await salesAPI.getSalesOrderDetail(orderId)
      setSelectedOrder(response.data)
      setOrderItems(response.data.items || [])
      setDetailDrawerVisible(true)
    } catch (error) {
      message.error('获取订单详情失败')
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      
      // 计算总金额和毛利
      const totalAmount = values.items.reduce((sum: number, item: any) => 
        sum + (item.quantity * item.unit_price), 0)
      
      const formData = {
        ...values,
        total_amount: totalAmount,
        order_date: values.order_date || new Date().toISOString().split('T')[0]
      }

      if (editingOrder) {
        await salesAPI.updateSalesOrder(editingOrder.id, formData)
        message.success('销售订单更新成功')
      } else {
        await salesAPI.createSalesOrder(formData)
        message.success('销售订单创建成功')
      }
      
      setModalVisible(false)
      setEditingOrder(null)
      form.resetFields()
      fetchOrders()
    } catch (error: any) {
      if (error.response) {
        message.error(error.response.data?.error || '操作失败')
      }
    }
  }

  const handleEdit = (record: SalesOrder) => {
    setEditingOrder(record)
    form.setFieldsValue({
      customer_id: record.customer_id,
      warehouse_id: record.warehouse_id,
      order_date: record.order_date,
      delivery_date: record.delivery_date,
      remarks: record.remarks
    })
    setModalVisible(true)
  }

  const handleDelete = async (id: number) => {
    try {
      await salesAPI.deleteSalesOrder(id)
      message.success('销售订单删除成功')
      fetchOrders()
    } catch (error) {
      message.error('删除失败')
    }
  }

  const handleDeliver = async () => {
    try {
      const values = await deliverForm.validateFields()
      await salesAPI.deliverSalesOrder(selectedOrder!.id, { items: values.items })
      message.success('出库成功')
      setDeliverModalVisible(false)
      deliverForm.resetFields()
      fetchOrders()
      if (selectedOrder) {
        fetchOrderDetail(selectedOrder.id)
      }
    } catch (error: any) {
      message.error(error.response?.data?.error || '出库失败')
    }
  }

  const openDeliverModal = async (record: SalesOrder) => {
    try {
      const response = await salesAPI.getSalesOrderDetail(record.id)
      const orderData = response.data
      setSelectedOrder(orderData)
      
      // 获取库存信息以供出库参考
      const inventoryPromises = orderData.items.map(async (item: SalesOrderItem) => {
        try {
          const invResponse = await inventoryAPI.getInventory({ 
            item_id: item.item_id, 
            warehouse_id: record.warehouse_id 
          })
          return {
            ...item,
            available_stock: invResponse.data[0]?.available_quantity || 0
          }
        } catch {
          return { ...item, available_stock: 0 }
        }
      })
      
      const itemsWithStock = await Promise.all(inventoryPromises)
      
      deliverForm.setFieldsValue({
        items: itemsWithStock.map(item => ({
          item_id: item.item_id,
          warehouse_id: record.warehouse_id,
          delivered_quantity: Math.min(
            item.quantity - item.delivered_quantity,
            item.available_stock
          )
        }))
      })
      
      setDeliverModalVisible(true)
    } catch (error) {
      message.error('获取订单信息失败')
    }
  }

  const handleTableChange = (newPagination: any) => {
    setPagination(prev => ({
      ...prev,
      current: newPagination.current,
      pageSize: newPagination.pageSize
    }))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'orange'
      case 'partial': return 'blue'
      case 'completed': return 'green'
      case 'cancelled': return 'red'
      default: return 'default'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '待处理'
      case 'partial': return '部分发货'
      case 'completed': return '已完成'
      case 'cancelled': return '已取消'
      default: return status
    }
  }

  const columns = [
    {
      title: '订单编号',
      dataIndex: 'order_no',
      key: 'order_no',
      width: 120,
      fixed: 'left' as const,
    },
    {
      title: '客户信息',
      key: 'customerInfo',
      width: 180,
      render: (record: SalesOrder) => (
        <div>
          <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{record.customer_name}</div>
          <div style={{ color: '#666', fontSize: '12px' }}>{record.warehouse_name}</div>
        </div>
      ),
    },
    {
      title: '订单日期',
      dataIndex: 'order_date',
      key: 'order_date',
      width: 100,
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: '金额信息',
      key: 'amountInfo',
      width: 140,
      render: (record: SalesOrder) => (
        <div style={{ fontSize: '12px' }}>
          <div style={{ fontWeight: 'bold' }}>总额: ¥{record.total_amount}</div>
          <div style={{ color: '#52c41a' }}>利润: ¥{record.gross_profit}</div>
        </div>
      ),
    },
    {
      title: '毛利率',
      key: 'margin',
      width: 80,
      render: (record: SalesOrder) => {
        const margin = record.profit_margin || 0;
        return (
          <span style={{ 
            color: margin > 20 ? '#52c41a' : margin > 10 ? '#faad14' : '#ff4d4f',
            fontWeight: 'bold',
            fontSize: '13px'
          }}>
            {margin.toFixed(1)}%
          </span>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={getStatusColor(status)} style={{ fontSize: '11px' }}>
          {getStatusText(status)}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right' as const,
      render: (record: SalesOrder) => (
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            style={{ padding: '0 4px', fontSize: '11px' }}
            onClick={() => fetchOrderDetail(record.id)}
          >
            详情
          </Button>
          {record.status !== 'completed' && record.status !== 'cancelled' && (
            <>
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                style={{ padding: '0 4px', fontSize: '11px' }}
                onClick={() => handleEdit(record)}
              >
                编辑
              </Button>
              <Button
                type="link"
                size="small"
                icon={<TruckOutlined />}
                style={{ padding: '0 4px', fontSize: '11px' }}
                onClick={() => openDeliverModal(record)}
              >
                出库
              </Button>
            </>
          )}
          <Button
            type="link"
            danger
            size="small"
            icon={<DeleteOutlined />}
            style={{ padding: '0 4px', fontSize: '11px' }}
            onClick={() => {
              Modal.confirm({
                title: '确认删除',
                content: '确定要删除这个销售订单吗？',
                onOk: () => handleDelete(record.id)
              })
            }}
          >
            删除
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <div className="page-header">
        <h1>销售管理</h1>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingOrder(null)
            form.resetFields()
            setModalVisible(true)
          }}
        >
          新增订单
        </Button>
      </div>

      {/* 搜索筛选区域 */}
      <div className="form-container" style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col span={5}>
            <Input
              placeholder="搜索订单编号"
              allowClear
              value={searchFilters.order_no}
              onChange={(e) => setSearchFilters({ ...searchFilters, order_no: e.target.value })}
              prefix={<SearchOutlined />}
            />
          </Col>
          <Col span={5}>
            <Select
              placeholder="选择客户"
              allowClear
              style={{ width: '100%' }}
              value={searchFilters.customer_id}
              onChange={(value) => setSearchFilters({ ...searchFilters, customer_id: value || '' })}
              showSearch
              filterOption={(input, option) =>
                String(option?.children || '').toLowerCase().includes(input.toLowerCase())
              }
            >
              {customers.map(customer => (
                <Select.Option key={customer.id} value={customer.id}>
                  {customer.name}
                </Select.Option>
              ))}
            </Select>
          </Col>
          <Col span={5}>
            <Select
              placeholder="订单状态"
              allowClear
              style={{ width: '100%' }}
              value={searchFilters.status}
              onChange={(value) => setSearchFilters({ ...searchFilters, status: value || '' })}
            >
              <Select.Option value="pending">待处理</Select.Option>
              <Select.Option value="partial">部分发货</Select.Option>
              <Select.Option value="completed">已完成</Select.Option>
              <Select.Option value="cancelled">已取消</Select.Option>
            </Select>
          </Col>
          <Col span={3}>
            <Button 
              type="primary"
              icon={<SearchOutlined />}
              onClick={fetchOrders}
            >
              搜索
            </Button>
          </Col>
        </Row>
      </div>

      <div className="table-container">
        <Table
          columns={columns}
          dataSource={orders}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
            pageSizeOptions: ['10', '20', '50'],
          }}
          onChange={handleTableChange}
          scroll={{ x: 1000 }}
          size="small"
        />
      </div>

      {/* 新增/编辑订单Modal */}
      <Modal
        title={editingOrder ? '编辑销售订单' : '新增销售订单'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => {
          setModalVisible(false)
          setEditingOrder(null)
          form.resetFields()
        }}
        width={800}
        okText="确定"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="customer_id"
                label="客户"
                rules={[{ required: true, message: '请选择客户' }]}
              >
                <Select
                  placeholder="请选择客户"
                  showSearch
                  filterOption={(input, option) =>
                    String(option?.children || '').toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {customers.map(customer => (
                    <Select.Option key={customer.id} value={customer.id}>
                      {customer.name} ({customer.customer_type === 'retail' ? '零售' : '批发'})
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="warehouse_id"
                label="发货仓库"
                rules={[{ required: true, message: '请选择发货仓库' }]}
              >
                <Select placeholder="请选择发货仓库">
                  {warehouses.map(warehouse => (
                    <Select.Option key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="order_date"
                label="订单日期"
                rules={[{ required: true, message: '请选择订单日期' }]}
              >
                <Input type="date" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="delivery_date" label="预计交货日期">
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
                      <Col span={8}>
                        <Form.Item
                          {...restField}
                          name={[name, 'item_id']}
                          rules={[{ required: true, message: '请选择货品' }]}
                        >
                          <Select
                            placeholder="选择货品"
                            showSearch
                            filterOption={(input, option) =>
                              String(option?.children || '').toLowerCase().includes(input.toLowerCase())
                            }
                            onChange={(itemId) => {
                              const selectedItem = items.find(item => item.id === itemId)
                              if (selectedItem) {
                                const currentItems = form.getFieldValue('items') || []
                                currentItems[name] = {
                                  ...currentItems[name],
                                  item_id: itemId,
                                  unit_price: selectedItem.sale_price || 0
                                }
                                form.setFieldsValue({ items: currentItems })
                              }
                            }}
                          >
                            {items.map(item => (
                              <Select.Option key={item.id} value={item.id}>
                                {item.code} - {item.name} (¥{item.sale_price})
                              </Select.Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={4}>
                        <Form.Item
                          {...restField}
                          name={[name, 'quantity']}
                          rules={[{ required: true, message: '请输入数量' }]}
                        >
                          <InputNumber 
                            placeholder="数量" 
                            min={1} 
                            style={{ width: '100%' }}
                            onChange={() => {
                              // 触发表单重新计算
                              form.validateFields([['items', name, 'unit_price']])
                            }}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={5}>
                        <Form.Item
                          {...restField}
                          name={[name, 'unit_price']}
                          rules={[{ required: true, message: '请输入单价' }]}
                        >
                          <InputNumber 
                            placeholder="单价" 
                            min={0} 
                            precision={2} 
                            style={{ width: '100%' }}
                            formatter={(value) => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={(value) => value!.replace(/¥\s?|(,*)/g, '')}
                            onChange={() => {
                              // 触发表单重新计算
                              form.validateFields([['items', name, 'quantity']])
                            }}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={5}>
                        <Form.Item dependencies={[['items', name, 'quantity'], ['items', name, 'unit_price']]} noStyle>
                          {({ getFieldValue }) => {
                            const quantity = getFieldValue(['items', name, 'quantity']) || 0
                            const unitPrice = getFieldValue(['items', name, 'unit_price']) || 0
                            const total = quantity * unitPrice
                            return (
                              <div style={{ 
                                lineHeight: '32px', 
                                textAlign: 'center',
                                fontWeight: 'bold',
                                color: '#1890ff',
                                backgroundColor: total > 0 ? '#f0f9ff' : 'transparent',
                                border: total > 0 ? '1px solid #d1ecf1' : 'none',
                                borderRadius: '4px'
                              }}>
                                ¥{total.toFixed(2)}
                              </div>
                            )
                          }}
                        </Form.Item>
                      </Col>
                      <Col span={2}>
                        <Button 
                          type="link" 
                          danger 
                          onClick={() => remove(name)}
                          icon={<DeleteOutlined />}
                        />
                      </Col>
                    </Row>
                  ))}
                  <Button 
                    type="dashed" 
                    onClick={() => add()} 
                    block 
                    icon={<PlusOutlined />}
                  >
                    添加商品
                  </Button>
                </>
              )}
            </Form.List>
          </Form.Item>

          <Form.Item name="remarks" label="备注">
            <Input.TextArea rows={3} placeholder="请输入备注信息" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 订单详情Drawer */}
      <Drawer
        title="销售订单详情"
        open={detailDrawerVisible}
        onClose={() => setDetailDrawerVisible(false)}
        width={600}
      >
        {selectedOrder && (
          <div>
            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item label="订单编号">{selectedOrder.order_no}</Descriptions.Item>
              <Descriptions.Item label="客户名称">{selectedOrder.customer_name}</Descriptions.Item>
              <Descriptions.Item label="发货仓库">{selectedOrder.warehouse_name}</Descriptions.Item>
              <Descriptions.Item label="订单日期">{selectedOrder.order_date}</Descriptions.Item>
              <Descriptions.Item label="交货日期">{selectedOrder.delivery_date || '未设置'}</Descriptions.Item>
              <Descriptions.Item label="订单状态">
                <Tag color={getStatusColor(selectedOrder.status)}>
                  {getStatusText(selectedOrder.status)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="订单总额">¥{selectedOrder.total_amount}</Descriptions.Item>
              <Descriptions.Item label="总成本">¥{selectedOrder.total_cost}</Descriptions.Item>
              <Descriptions.Item label="毛利润">
                <span style={{ color: '#52c41a', fontWeight: 'bold' }}>
                  ¥{selectedOrder.gross_profit}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="毛利率">
                <span style={{ 
                  color: selectedOrder.profit_margin > 20 ? '#52c41a' : 
                         selectedOrder.profit_margin > 10 ? '#faad14' : '#ff4d4f',
                  fontWeight: 'bold'
                }}>
                  {selectedOrder.profit_margin?.toFixed(1)}%
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="备注">{selectedOrder.remarks || '无'}</Descriptions.Item>
            </Descriptions>

            <Divider>订单明细</Divider>
            
            <Table
              size="small"
              dataSource={orderItems}
              rowKey="id"
              pagination={false}
              columns={[
                {
                  title: '货品',
                  key: 'item',
                  render: (record: SalesOrderItem) => 
                    `${record.item_code} - ${record.item_name}`
                },
                {
                  title: '数量',
                  dataIndex: 'quantity',
                  align: 'right' as const,
                  render: (qty: number, record: SalesOrderItem) => `${qty} ${record.unit}`
                },
                {
                  title: '单价',
                  dataIndex: 'unit_price',
                  align: 'right' as const,
                  render: (price: number) => `¥${price}`
                },
                {
                  title: '小计',
                  dataIndex: 'total_price',
                  align: 'right' as const,
                  render: (total: number) => `¥${total}`
                },
                {
                  title: '已发货',
                  dataIndex: 'delivered_quantity',
                  align: 'right' as const,
                  render: (qty: number, record: SalesOrderItem) => `${qty} ${record.unit}`
                }
              ]}
            />
          </div>
        )}
      </Drawer>

      {/* 出库Modal */}
      <Modal
        title="销售出库"
        open={deliverModalVisible}
        onOk={handleDeliver}
        onCancel={() => {
          setDeliverModalVisible(false)
          deliverForm.resetFields()
        }}
        width={700}
        okText="确认出库"
        cancelText="取消"
      >
        <Form form={deliverForm} layout="vertical">
          <Alert
            message="请确认出库数量，系统将自动扣减对应的库存"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          
          <Form.List name="items">
            {(fields) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Row key={key} gutter={8} align="middle" style={{ marginBottom: 8 }}>
                    <Col span={8}>
                      <Form.Item
                        {...restField}
                        name={[name, 'item_id']}
                        hidden
                      >
                        <Input />
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, 'warehouse_id']}
                        hidden
                      >
                        <Input />
                      </Form.Item>
                      <div style={{ lineHeight: '32px' }}>
                        {orderItems[name]?.item_name || '货品'}
                      </div>
                    </Col>
                    <Col span={4}>
                      <div style={{ lineHeight: '32px', textAlign: 'center' }}>
                        待发: {(orderItems[name]?.quantity || 0) - (orderItems[name]?.delivered_quantity || 0)}
                      </div>
                    </Col>
                    <Col span={4}>
                      <div style={{ lineHeight: '32px', textAlign: 'center' }}>
                        库存: {(orderItems[name] as any)?.available_stock || 0}
                      </div>
                    </Col>
                    <Col span={6}>
                      <Form.Item
                        {...restField}
                        name={[name, 'delivered_quantity']}
                        rules={[{ required: true, message: '请输入出库数量' }]}
                      >
                        <InputNumber 
                          placeholder="出库数量" 
                          min={0}
                          max={(orderItems[name]?.quantity || 0) - (orderItems[name]?.delivered_quantity || 0)}
                          style={{ width: '100%' }} 
                        />
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

export default Sales 