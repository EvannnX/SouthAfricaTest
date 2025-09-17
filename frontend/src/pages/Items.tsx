import { PlusOutlined, SearchOutlined } from '@ant-design/icons'
import { Button, Form, Input, InputNumber, message, Modal, Select, Space, Table } from 'antd'
import React, { useEffect, useState } from 'react'
// import BarcodeManager from '../components/BarcodeManager'
// import MultiUnitManager from '../components/MultiUnitManager'
// import ProductImageGallery from '../components/ProductImageGallery'
import { itemsAPI } from '../services/api'
import { getBilingualName } from '../utils/itemNames'

interface Item {
  id: number
  code: string
  name: string
  en_name?: string
  category: string
  unit: string
  description: string
  purchase_price: number
  sale_price: number
  min_stock: number
  max_stock: number
  status: string
  created_at: string
  updated_at: string
  barcodes?: Barcode[]
  images?: ProductImage[]
  units?: Unit[]
  prices?: PriceLevel[]
  suppliers?: SupplierPrice[]
}

interface Barcode {
  id?: number
  code: string
  type: 'ean13' | 'ean8' | 'code128' | 'custom'
  is_primary: boolean
}

interface ProductImage {
  id?: number
  url: string
  type: 'main' | 'detail' | 'other'
  sort_order: number
}

interface Unit {
  id?: number
  name: string
  conversion_rate: number
  is_base_unit: boolean
}

interface PriceLevel {
  id?: number
  type: string
  price: number
  min_quantity: number
  max_quantity?: number
  customer_type: string
}

interface SupplierPrice {
  id?: number
  supplier_id: number
  supplier_name?: string
  supplier_code?: string
  price: number
  min_order_qty: number
  lead_time: number
  is_primary: boolean
}

const Items: React.FC = () => {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const [form] = Form.useForm()
  const [searchText, setSearchText] = useState('')
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  })
  
  // 新增状态管理
  const [productImages, setProductImages] = useState<ProductImage[]>([])
  const [barcodes, setBarcodes] = useState<Barcode[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [priceLevels, setPriceLevels] = useState<PriceLevel[]>([])
  const [supplierPrices, setSupplierPrices] = useState<SupplierPrice[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState('basic')

  useEffect(() => {
    fetchItems()
  }, [pagination.current, searchText])

  const fetchItems = async () => {
    setLoading(true)
    try {
      const response = await itemsAPI.getItems({
        page: pagination.current,
        pageSize: pagination.pageSize,
        search: searchText
      })
      setItems(response.data.data)
      setPagination(prev => ({
        ...prev,
        total: response.data.total
      }))
    } catch (error: any) {
      message.error('获取货品列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingItem(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (item: Item) => {
    setEditingItem(item)
    form.setFieldsValue({ ...item, en_name: (item as any).en_name })
    setModalVisible(true)
  }

  const handleDelete = async (id: number) => {
    try {
      await itemsAPI.deleteItem(id)
      message.success('删除成功')
      fetchItems()
    } catch (error: any) {
      message.error(error.response?.data?.error || '删除失败')
    }
  }

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields()
      
      if (editingItem) {
        // 编辑
        await itemsAPI.updateItem(editingItem.id, values)
        message.success('更新成功')
      } else {
        // 新增
        await itemsAPI.createItem(values)
        message.success('添加成功')
      }
      
      setModalVisible(false)
      fetchItems()
    } catch (error: any) {
      if (error.response) {
        message.error(error.response.data?.error || '操作失败')
      }
    }
  }

  const handleSearch = (value: string) => {
    setSearchText(value)
    setPagination(prev => ({ ...prev, current: 1 }))
  }

  const handleTableChange = (newPagination: any) => {
    setPagination(prev => ({
      ...prev,
      current: newPagination.current,
      pageSize: newPagination.pageSize
    }))
  }

  const columns = [
    {
      title: '编码',
      dataIndex: 'code',
      key: 'code',
      width: 80,
      fixed: 'left' as const,
    },
    {
      title: '货品信息',
      key: 'itemInfo',
      width: 200,
      render: (record: any) => {
        const { en, zh } = getBilingualName(record.code, (record as any).en_name || record.name)
        return (
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{en}</div>
            {zh && zh !== en && (
              <div style={{ color: '#666', fontSize: '12px' }}>{zh}</div>
            )}
          </div>
        )
      },
    },
    {
      title: '价格信息',
      key: 'priceInfo',
      width: 120,
      render: (record: any) => (
        <div style={{ fontSize: '12px' }}>
          <div>进价: ¥{record.purchase_price}</div>
          <div style={{ color: '#1890ff' }}>售价: ¥{record.sale_price}</div>
        </div>
      ),
    },
    {
      title: '毛利率',
      key: 'margin',
      width: 80,
      render: (record: any) => {
        const margin = record.sale_price > 0 
          ? ((record.sale_price - record.purchase_price) / record.sale_price * 100).toFixed(1)
          : '0.0';
        return (
          <span style={{ 
            color: parseFloat(margin) > 20 ? '#52c41a' : parseFloat(margin) > 10 ? '#faad14' : '#ff4d4f',
            fontWeight: 'bold',
            fontSize: '13px'
          }}>
            {margin}%
          </span>
        );
      },
    },
    {
      title: '库存',
      key: 'stock',
      width: 100,
      render: (record: any) => (
        <div style={{ fontSize: '12px', textAlign: 'center' }}>
          <div>最小: {record.min_stock}</div>
          <div>最大: {record.max_stock}</div>
        </div>
      ),
    },
    {
      title: '单位',
      dataIndex: 'unit',
      key: 'unit',
      width: 50,
      align: 'center' as const,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 70,
      align: 'center' as const,
      render: (status: string) => (
        <span style={{
          padding: '2px 6px',
          borderRadius: '4px',
          fontSize: '11px',
          backgroundColor: status === 'active' ? '#f6ffed' : '#fff2e8',
          color: status === 'active' ? '#52c41a' : '#fa8c16',
          border: `1px solid ${status === 'active' ? '#b7eb8f' : '#ffd591'}`
        }}>
          {status === 'active' ? '启用' : '停用'}
        </span>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right' as const,
      render: (record: any) => (
        <div style={{ display: 'flex', gap: '4px' }}>
          <Button
            type="link"
            size="small"
            style={{ padding: '0 4px', fontSize: '12px' }}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            danger
            size="small"
            style={{ padding: '0 4px', fontSize: '12px' }}
            onClick={() => handleDelete(record.id)}
          >
            删除
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px', background: '#f0f2f5' }}>
      <div className="page-header">
        <h1>货品管理</h1>
        <Space>
          <Input.Search
            placeholder="搜索货品编码或名称"
            allowClear
            style={{ width: 300 }}
            onSearch={handleSearch}
            enterButton={<SearchOutlined />}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增货品
          </Button>
        </Space>
      </div>

      <div className="table-container">
        <Table
          columns={columns}
          dataSource={items}
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
          scroll={{ x: 900 }}
          size="small"
          style={{ fontSize: '12px' }}
        />
      </div>

      <Modal
        title={editingItem ? '编辑货品' : '新增货品'}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => setModalVisible(false)}
        width={600}
        okText="确定"
        cancelText="取消"
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            unit: '个',
            status: 'active',
            purchase_price: 0,
            sale_price: 0,
            min_stock: 0,
            max_stock: 0
          }}
        >
          <Form.Item
            name="code"
            label="货品编码"
            rules={[{ required: true, message: '请输入货品编码' }]}
          >
            <Input placeholder="请输入货品编码" disabled={!!editingItem} />
          </Form.Item>

          <Form.Item
            name="name"
            label="货品名称（中文）"
            rules={[{ required: true, message: '请输入中文名称' }]}
          >
            <Input placeholder="请输入中文名称" />
          </Form.Item>

          <Form.Item
            name="en_name"
            label="英文名称（English Name）"
          >
            <Input placeholder="Optional - 英文显示名称" />
          </Form.Item>

          <Form.Item name="category" label="分类">
            <Input placeholder="请输入货品分类" />
          </Form.Item>

          <Form.Item name="unit" label="单位">
            <Select>
              <Select.Option value="个">个</Select.Option>
              <Select.Option value="台">台</Select.Option>
              <Select.Option value="只">只</Select.Option>
              <Select.Option value="对">对</Select.Option>
              <Select.Option value="件">件</Select.Option>
              <Select.Option value="盒">盒</Select.Option>
              <Select.Option value="包">包</Select.Option>
              <Select.Option value="箱">箱</Select.Option>
            </Select>
          </Form.Item>

          <div style={{ display: 'flex', gap: '16px' }}>
            <Form.Item
              name="purchase_price"
              label="采购价格"
              style={{ flex: 1 }}
              rules={[{ required: true, message: '请输入采购价格' }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="0.00"
                min={0}
                precision={2}
                addonBefore="¥"
              />
            </Form.Item>

            <Form.Item
              name="sale_price"
              label="销售价格"
              style={{ flex: 1 }}
              rules={[{ required: true, message: '请输入销售价格' }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="0.00"
                min={0}
                precision={2}
                addonBefore="¥"
              />
            </Form.Item>
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <Form.Item
              name="min_stock"
              label="最小库存"
              style={{ flex: 1 }}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="0"
                min={0}
              />
            </Form.Item>

            <Form.Item
              name="max_stock"
              label="最大库存"
              style={{ flex: 1 }}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="0"
                min={0}
              />
            </Form.Item>
          </div>

          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} placeholder="请输入货品描述" />
          </Form.Item>

          <Form.Item name="status" label="状态">
            <Select>
              <Select.Option value="active">启用</Select.Option>
              <Select.Option value="inactive">停用</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Items 