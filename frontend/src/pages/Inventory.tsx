import {
    EyeOutlined, RedoOutlined,
    SwapOutlined, WarningOutlined
} from '@ant-design/icons'
import {
    Alert, Button,
    Col, Form, Input, InputNumber, message, Modal,
    Row, Select, Space, Table, Tabs, Tag
} from 'antd'
import React, { useEffect, useState } from 'react'
import { inventoryAPI, itemsAPI, warehousesAPI } from '../services/api'
import { getItemDisplayName } from '../utils/itemNames'
// 使用双语回退
import { getBilingualName } from '../utils/itemNames'

interface InventoryItem {
  id: number
  item_id: number
  warehouse_id: number
  quantity: number
  available_quantity: number
  reserved_quantity: number
  avg_cost: number
  last_updated: string
  item_name: string
  item_code: string
  unit: string
  min_stock: number
  max_stock: number
  warehouse_name: string
  warehouse_code: string
}

interface InventoryTransaction {
  id: number
  item_id: number
  warehouse_id: number
  transaction_type: string
  reference_no: string
  reference_type: string
  quantity: number
  unit_cost: number
  transaction_date: string
  remarks: string
  item_name: string
  item_code: string
  warehouse_name: string
}

const Inventory: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([])
  const [alerts, setAlerts] = useState<InventoryItem[]>([])
  const [items, setItems] = useState<any[]>([])
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [transferModalVisible, setTransferModalVisible] = useState(false)
  const [adjustModalVisible, setAdjustModalVisible] = useState(false)
  const [activeTab, setActiveTab] = useState('inventory')

  const [searchFilters, setSearchFilters] = useState({
    warehouse_id: '',
    item_id: '',
    low_stock: false
  })

  const [transferForm] = Form.useForm()
  const [adjustForm] = Form.useForm()

  useEffect(() => {
    fetchItems()
    fetchWarehouses()
    fetchInventory()
  }, [])

  useEffect(() => {
    if (activeTab === 'inventory') {
      fetchInventory()
    } else if (activeTab === 'transactions') {
      fetchTransactions()
    } else if (activeTab === 'alerts') {
      fetchAlerts()
    }
  }, [activeTab, searchFilters])

  const fetchItems = async () => {
    try {
      const response = await itemsAPI.getItems({ pageSize: 1000 })
      setItems(response.data.data)
    } catch (error) {
      message.error('获取货品列表失败')
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

  const fetchInventory = async () => {
    setLoading(true)
    try {
      const params = Object.fromEntries(
        Object.entries(searchFilters).filter(([key, v]) => v !== '' && v !== false)
      )
      const response = await inventoryAPI.getInventory(params)
      setInventory(response.data)
    } catch (error: any) {
      message.error('获取库存列表失败')
    } finally {
      setLoading(false)
    }
  }

  const fetchTransactions = async () => {
    setLoading(true)
    try {
      const params = Object.fromEntries(
        Object.entries(searchFilters).filter(([key, v]) => 
          v !== '' && key !== 'low_stock'
        )
      )
      const response = await inventoryAPI.getInventoryTransactions({ ...params, pageSize: 50 })
      setTransactions(response.data.data)
    } catch (error: any) {
      message.error('获取交易记录失败')
    } finally {
      setLoading(false)
    }
  }

  const fetchAlerts = async () => {
    setLoading(true)
    try {
      const response = await inventoryAPI.getInventoryAlerts()
      setAlerts(response.data)
    } catch (error: any) {
      message.error('获取库存预警失败')
    } finally {
      setLoading(false)
    }
  }

  const handleTransfer = async () => {
    try {
      const values = await transferForm.validateFields()
      await inventoryAPI.transferInventory(values)
      message.success('库存调拨成功')
      setTransferModalVisible(false)
      transferForm.resetFields()
      fetchInventory()
    } catch (error: any) {
      if (error.response) {
        message.error(error.response.data?.error || '调拨失败')
      }
    }
  }

  const handleAdjust = async () => {
    try {
      const values = await adjustForm.validateFields()
      await inventoryAPI.adjustInventory(values)
      message.success('库存调整成功')
      setAdjustModalVisible(false)
      adjustForm.resetFields()
      fetchInventory()
    } catch (error: any) {
      if (error.response) {
        message.error(error.response.data?.error || '调整失败')
      }
    }
  }

  const openTransferModal = (record: InventoryItem) => {
    transferForm.setFieldsValue({
      item_id: record.item_id,
      from_warehouse_id: record.warehouse_id,
      to_warehouse_id: '',
      quantity: 0,
      remarks: ''
    })
    setTransferModalVisible(true)
  }

  const openAdjustModal = (record: InventoryItem) => {
    adjustForm.setFieldsValue({
      item_id: record.item_id,
      warehouse_id: record.warehouse_id,
      adjust_quantity: 0,
      remarks: ''
    })
    setAdjustModalVisible(true)
  }

  // 库存查询表格列
  const inventoryColumns = [
    {
      title: '编码',
      dataIndex: 'item_code',
      key: 'item_code',
      width: 80,
      fixed: 'left' as const,
    },
    {
      title: '货品信息',
      key: 'itemInfo',
      width: 180,
      render: (record: any) => (
        (()=>{
          const { en, zh } = getBilingualName(record.item_code, (record as any).en_name || record.item_name)
          return (
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{en}</div>
              {zh && zh !== en && (<div style={{ color: '#666', fontSize: '12px' }}>{zh}</div>)}
              <div style={{ color: '#999', fontSize: '12px' }}>{record.warehouse_name}</div>
            </div>
          )
        })()
      ),
    },
    {
      title: '库存数量',
      key: 'stockInfo',
      width: 120,
      render: (record: any) => (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1890ff' }}>
            {record.quantity}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            可用: {record.available_quantity}
          </div>
        </div>
      ),
    },
    {
      title: '预警状态',
      key: 'alertStatus',
      width: 100,
      render: (record: any) => {
        let status = '正常';
        let color = '#52c41a';
        let bgColor = '#f6ffed';
        
        if (record.quantity <= 0) {
          status = '缺货';
          color = '#ff4d4f';
          bgColor = '#fff2f0';
        } else if (record.quantity <= record.min_stock) {
          status = '不足';
          color = '#faad14';
          bgColor = '#fffbe6';
        } else if (record.quantity >= record.max_stock) {
          status = '过多';
          color = '#722ed1';
          bgColor = '#f9f0ff';
        }
        
        return (
          <span style={{
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            backgroundColor: bgColor,
            color: color,
            fontWeight: 'bold'
          }}>
            {status}
          </span>
        );
      },
    },
    {
      title: '成本/单位',
      key: 'costUnit',
      width: 100,
      render: (record: any) => (
        <div style={{ textAlign: 'right', fontSize: '12px' }}>
          <div>¥{record.avg_cost || 0}</div>
          <div style={{ color: '#666' }}>{record.unit}</div>
        </div>
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'last_updated',
      key: 'last_updated',
      width: 100,
      render: (date: string) => (
        <div style={{ fontSize: '12px', color: '#666' }}>
          {new Date(date).toLocaleDateString()}
        </div>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      fixed: 'right' as const,
      render: (record: any) => (
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          <Button
            type="link"
            size="small"
            style={{ padding: '0 4px', fontSize: '11px' }}
            onClick={() => openTransferModal(record)}
          >
            调拨
          </Button>
          <Button
            type="link"
            size="small"
            style={{ padding: '0 4px', fontSize: '11px' }}
            onClick={() => openAdjustModal(record)}
          >
            调整
          </Button>
        </div>
      ),
    },
  ];

  // 交易记录表格列
  const transactionColumns = [
    {
      title: '时间',
      dataIndex: 'transaction_date',
      key: 'transaction_date',
      width: 150,
      render: (date: string) => new Date(date).toLocaleString()
    },
    {
      title: '货品',
      key: 'item',
      width: 200,
      render: (record: InventoryTransaction) => 
        `${record.item_code} - ${record.item_name}`
    },
    {
      title: '仓库',
      dataIndex: 'warehouse_name',
      key: 'warehouse_name',
      width: 120
    },
    {
      title: '类型',
      dataIndex: 'transaction_type',
      key: 'transaction_type',
      width: 80,
      render: (type: string) => (
        <Tag color={type === 'IN' ? 'green' : 'red'}>
          {type === 'IN' ? '入库' : '出库'}
        </Tag>
      )
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      align: 'right' as const,
      render: (qty: number) => (
        <span style={{ color: qty > 0 ? '#52c41a' : '#ff4d4f' }}>
          {qty > 0 ? '+' : ''}{qty}
        </span>
      )
    },
    {
      title: '单价',
      dataIndex: 'unit_cost',
      key: 'unit_cost',
      width: 100,
      align: 'right' as const,
      render: (cost: number) => `¥${cost || 0}`
    },
    {
      title: '业务类型',
      dataIndex: 'reference_type',
      key: 'reference_type',
      width: 100
    },
    {
      title: '备注',
      dataIndex: 'remarks',
      key: 'remarks',
      ellipsis: true
    }
  ]

  // 库存预警表格列
  const alertColumns = [
    {
      title: '货品编码',
      dataIndex: 'item_code',
      key: 'item_code',
      width: 120
    },
    {
      title: '货品名称',
      dataIndex: 'item_name',
      key: 'item_name',
      width: 200
    },
    {
      title: '仓库',
      dataIndex: 'warehouse_name',
      key: 'warehouse_name',
      width: 120
    },
    {
      title: '当前库存',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      align: 'right' as const,
      render: (qty: number, record: any) => (
        <span style={{ fontWeight: 'bold' }}>
          {qty} {record.unit}
        </span>
      )
    },
    {
      title: '最小库存',
      dataIndex: 'min_stock',
      key: 'min_stock',
      width: 100,
      align: 'right' as const,
      render: (value: number, record: any) => `${value} ${record.unit}`
    },
    {
      title: '最大库存',
      dataIndex: 'max_stock',
      key: 'max_stock',
      width: 100,
      align: 'right' as const,
      render: (value: number, record: any) => `${value} ${record.unit}`
    }
  ]

  const tabItems = [
    {
      key: 'inventory',
      label: (
        <span>
          <EyeOutlined />
          库存查询
        </span>
      ),
      children: (
        <div className="table-container">
          <Table
            columns={inventoryColumns}
            dataSource={inventory}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
            }}
            scroll={{ x: 800 }}
            size="small"
          />
        </div>
      )
    },
    {
      key: 'transactions',
      label: (
        <span>
          <RedoOutlined />
          交易记录
        </span>
      ),
      children: (
        <div className="table-container">
          <Table
            columns={transactionColumns}
            dataSource={transactions}
            rowKey="id"
            loading={loading}
            scroll={{ x: 1000 }}
            size="small"
            pagination={{
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`
            }}
          />
        </div>
      )
    },
    {
      key: 'alerts',
      label: (
        <span>
          <WarningOutlined />
          库存预警 {alerts.length > 0 && <span style={{ color: '#ff4d4f' }}>({alerts.length})</span>}
        </span>
      ),
      children: (
        <div className="table-container">
          {alerts.length > 0 && (
            <Alert
              message={`当前有 ${alerts.length} 个库存预警项目需要处理`}
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}
          <Table
            columns={alertColumns}
            dataSource={alerts}
            rowKey="id"
            loading={loading}
            scroll={{ x: 800 }}
            size="small"
            pagination={{
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`
            }}
          />
        </div>
      )
    }
  ]

  return (
    <div>
      <div className="page-header">
        <h1>库存管理</h1>
        <Space>
          <Button 
            type="primary" 
            icon={<SwapOutlined />} 
            onClick={() => setTransferModalVisible(true)}
          >
            库存调拨
          </Button>
          <Button 
            icon={<RedoOutlined />} 
            onClick={() => setAdjustModalVisible(true)}
          >
            库存调整
          </Button>
        </Space>
      </div>

      {/* 搜索筛选区域 */}
      <div className="form-container" style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col span={6}>
            <Select
              placeholder="选择仓库"
              allowClear
              style={{ width: '100%' }}
              value={searchFilters.warehouse_id}
              onChange={(value) => setSearchFilters({ ...searchFilters, warehouse_id: value || '' })}
            >
              {warehouses.map(warehouse => (
                <Select.Option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </Select.Option>
              ))}
            </Select>
          </Col>
          <Col span={6}>
            <Select
              placeholder="选择货品"
              allowClear
              style={{ width: '100%' }}
              value={searchFilters.item_id}
              onChange={(v)=>setSearchFilters({ ...searchFilters, item_id: v||'' })} showSearch filterOption={(i,o)=>String(o?.children||'').toLowerCase().includes(i.toLowerCase())}>
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
          </Col>
          <Col span={6}>
            <Select
              placeholder="库存状态"
              allowClear
              style={{ width: '100%' }}
              value={searchFilters.low_stock ? 'low' : ''}
              onChange={(value) => setSearchFilters({ ...searchFilters, low_stock: value === 'low' })}
            >
              <Select.Option value="low">库存不足</Select.Option>
            </Select>
          </Col>
        </Row>
      </div>

      <Tabs
        items={tabItems}
        activeKey={activeTab}
        onChange={setActiveTab}
      />

      {/* 库存调拨Modal */}
      <Modal
        title="库存调拨"
        open={transferModalVisible}
        onOk={handleTransfer}
        onCancel={() => setTransferModalVisible(false)}
        width={600}
        okText="确定调拨"
        cancelText="取消"
      >
        <Form form={transferForm} layout="vertical">
          <Form.Item
            name="item_id"
            label="货品"
            rules={[{ required: true, message: '请选择货品' }]}
          >
            <Select
              placeholder="选择货品"
              showSearch
              filterOption={(input, option) =>
                String(option?.children || '').toLowerCase().includes(input.toLowerCase())
              }
            >
              {items.map(item => (
                <Select.Option key={item.id} value={item.id}>
                  {item.code} - {item.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="from_warehouse_id"
                label="源仓库"
                rules={[{ required: true, message: '请选择源仓库' }]}
              >
                <Select placeholder="选择源仓库">
                  {warehouses.map(warehouse => (
                    <Select.Option key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="to_warehouse_id"
                label="目标仓库"
                rules={[{ required: true, message: '请选择目标仓库' }]}
              >
                <Select placeholder="选择目标仓库">
                  {warehouses.map(warehouse => (
                    <Select.Option key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="quantity"
            label="调拨数量"
            rules={[{ required: true, message: '请输入调拨数量' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="请输入调拨数量"
              min={1}
            />
          </Form.Item>

          <Form.Item name="remarks" label="备注">
            <Input.TextArea rows={3} placeholder="请输入备注信息" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 库存调整Modal */}
      <Modal
        title="库存调整"
        open={adjustModalVisible}
        onOk={handleAdjust}
        onCancel={() => setAdjustModalVisible(false)}
        width={600}
        okText="确定调整"
        cancelText="取消"
      >
        <Form form={adjustForm} layout="vertical">
          <Form.Item
            name="item_id"
            label="货品"
            rules={[{ required: true, message: '请选择货品' }]}
          >
            <Select
              placeholder="选择货品"
              showSearch
              filterOption={(input, option) =>
                String(option?.children || '').toLowerCase().includes(input.toLowerCase())
              }
            >
              {items.map(item => (
                <Select.Option key={item.id} value={item.id}>
                  {item.code} - {item.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="warehouse_id"
            label="仓库"
            rules={[{ required: true, message: '请选择仓库' }]}
          >
            <Select placeholder="选择仓库">
              {warehouses.map(warehouse => (
                <Select.Option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="adjust_quantity"
            label="调整数量"
            rules={[{ required: true, message: '请输入调整数量' }]}
            help="正数为增加库存，负数为减少库存"
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="请输入调整数量"
            />
          </Form.Item>

          <Form.Item name="remarks" label="备注">
            <Input.TextArea rows={3} placeholder="请输入备注信息" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Inventory 