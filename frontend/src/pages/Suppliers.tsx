import {
  MailOutlined,
  PhoneOutlined,
  PlusOutlined,
  SearchOutlined,
  ShopOutlined
} from '@ant-design/icons'
import {
  Button,
  Col, Form, Input, message, Modal, Row, Select, Table, Tag
} from 'antd'
import React, { useEffect, useState } from 'react'
import { suppliersAPI } from '../services/api'

interface Supplier {
  id: number
  code: string
  name: string
  supplier_type: string
  contact_person: string
  phone: string
  email: string
  address: string
  bank_account: string
  tax_number: string
  payment_terms: string
  status: string
  created_at: string
  updated_at: string
}

const Suppliers: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  })

  const [searchFilters, setSearchFilters] = useState({
    supplier_type: '',
    status: '',
    keyword: ''
  })

  const [form] = Form.useForm()

  useEffect(() => {
    fetchSuppliers()
  }, [pagination.current, pagination.pageSize, searchFilters])

  const fetchSuppliers = async () => {
    setLoading(true)
    try {
      const params = {
        page: pagination.current,
        pageSize: pagination.pageSize,
        ...Object.fromEntries(Object.entries(searchFilters).filter(([, v]) => v !== ''))
      }
      const response = await suppliersAPI.getSuppliers(params)
      setSuppliers(response.data.data)
      setPagination(prev => ({ ...prev, total: response.data.total }))
    } catch (error) {
      message.error('获取供应商列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()

      if (editingSupplier) {
        await suppliersAPI.updateSupplier(editingSupplier.id, values)
        message.success('供应商信息更新成功')
      } else {
        await suppliersAPI.createSupplier(values)
        message.success('供应商添加成功')
      }
      
      setModalVisible(false)
      setEditingSupplier(null)
      form.resetFields()
      fetchSuppliers()
    } catch (error: any) {
      if (error.response) {
        message.error(error.response.data?.error || '操作失败')
      }
    }
  }

  const handleEdit = (record: Supplier) => {
    setEditingSupplier(record)
    form.setFieldsValue(record)
    setModalVisible(true)
  }

  const handleDelete = async (id: number) => {
    try {
      await suppliersAPI.deleteSupplier(id)
      message.success('供应商删除成功')
      fetchSuppliers()
    } catch (error: any) {
      message.error(error.response?.data?.error || '删除失败')
    }
  }

  const getSupplierTypeColor = (type: string) => {
    switch (type) {
      case 'manufacturer': return 'blue'
      case 'distributor': return 'green'
      case 'retailer': return 'orange'
      case 'service': return 'purple'
      default: return 'default'
    }
  }

  const getSupplierTypeText = (type: string) => {
    switch (type) {
      case 'manufacturer': return '生产商'
      case 'distributor': return '分销商'
      case 'retailer': return '零售商'
      case 'service': return '服务商'
      default: return type
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'green'
      case 'inactive': return 'red'
      case 'pending': return 'orange'
      case 'suspended': return 'volcano'
      default: return 'default'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return '合作中'
      case 'inactive': return '停用'
      case 'pending': return '待审核'
      case 'suspended': return '暂停'
      default: return status
    }
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
      title: '供应商信息',
      key: 'supplierInfo',
      width: 180,
      render: (record: Supplier) => (
        <div>
          <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
            <ShopOutlined style={{ marginRight: '4px', color: '#1890ff' }} />
            {record.name}
          </div>
          <div style={{ color: '#666', fontSize: '12px' }}>联系人: {record.contact_person}</div>
        </div>
      ),
    },
    {
      title: '联系方式',
      key: 'contactInfo',
      width: 140,
      render: (record: Supplier) => (
        <div style={{ fontSize: '12px' }}>
          <div style={{ marginBottom: '2px' }}>
            <PhoneOutlined style={{ marginRight: '4px', color: '#52c41a' }} />
            {record.phone}
          </div>
          <div>
            <MailOutlined style={{ marginRight: '4px', color: '#faad14' }} />
            {record.email || '未填写'}
          </div>
        </div>
      ),
    },
    {
      title: '类型',
      dataIndex: 'supplier_type',
      key: 'supplier_type',
      width: 80,
      render: (type: string) => (
        <Tag color={getSupplierTypeColor(type)} style={{ fontSize: '11px' }}>
          {getSupplierTypeText(type)}
        </Tag>
      ),
    },
    {
      title: '付款条件',
      dataIndex: 'payment_terms',
      key: 'payment_terms',
      width: 100,
      render: (terms: string) => (
        <span style={{ fontSize: '12px' }}>
          {terms || '月结30天'}
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => (
        <Tag color={getStatusColor(status)} style={{ fontSize: '11px' }}>
          {getStatusText(status)}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right' as const,
      render: (record: Supplier) => (
        <div style={{ display: 'flex', gap: '4px' }}>
          <Button
            type="link"
            size="small"
            style={{ padding: '0 4px', fontSize: '11px' }}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            danger
            size="small"
            style={{ padding: '0 4px', fontSize: '11px' }}
            onClick={() => {
              Modal.confirm({
                title: '确认删除',
                content: `确定要删除供应商 "${record.name}" 吗？`,
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
        <h1>供应商管理</h1>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingSupplier(null)
            form.resetFields()
            setModalVisible(true)
          }}
        >
          新增供应商
        </Button>
      </div>

      {/* 搜索筛选区域 */}
      <div className="form-container" style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col span={6}>
            <Input
              placeholder="搜索供应商名称/编码/联系人"
              allowClear
              value={searchFilters.keyword}
              onChange={(e) => setSearchFilters({ ...searchFilters, keyword: e.target.value })}
              prefix={<SearchOutlined />}
            />
          </Col>
          <Col span={4}>
            <Select
              placeholder="供应商类型"
              allowClear
              style={{ width: '100%' }}
              value={searchFilters.supplier_type}
              onChange={(value) => setSearchFilters({ ...searchFilters, supplier_type: value || '' })}
            >
              <Select.Option value="manufacturer">生产商</Select.Option>
              <Select.Option value="distributor">分销商</Select.Option>
              <Select.Option value="retailer">零售商</Select.Option>
              <Select.Option value="service">服务商</Select.Option>
            </Select>
          </Col>
          <Col span={4}>
            <Select
              placeholder="供应商状态"
              allowClear
              style={{ width: '100%' }}
              value={searchFilters.status}
              onChange={(value) => setSearchFilters({ ...searchFilters, status: value || '' })}
            >
              <Select.Option value="active">合作中</Select.Option>
              <Select.Option value="inactive">停用</Select.Option>
              <Select.Option value="pending">待审核</Select.Option>
              <Select.Option value="suspended">暂停</Select.Option>
            </Select>
          </Col>
          <Col span={3}>
            <Button 
              type="primary"
              icon={<SearchOutlined />}
              onClick={fetchSuppliers}
            >
              搜索
            </Button>
          </Col>
        </Row>
      </div>

      <div className="table-container">
        <Table
          columns={columns}
          dataSource={suppliers}
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
          onChange={(newPagination: any) => {
            setPagination(prev => ({
              ...prev,
              current: newPagination.current,
              pageSize: newPagination.pageSize
            }))
          }}
          scroll={{ x: 800 }}
          size="small"
        />
      </div>

      {/* 新增/编辑供应商Modal */}
      <Modal
        title={editingSupplier ? '编辑供应商信息' : '新增供应商'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => {
          setModalVisible(false)
          setEditingSupplier(null)
          form.resetFields()
        }}
        width={700}
        okText="确定"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="code"
                label="供应商编码"
                rules={[{ required: true, message: '请输入供应商编码' }]}
              >
                <Input placeholder="请输入供应商编码" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="name"
                label="供应商名称"
                rules={[{ required: true, message: '请输入供应商名称' }]}
              >
                <Input placeholder="请输入供应商名称" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="supplier_type"
                label="供应商类型"
                rules={[{ required: true, message: '请选择供应商类型' }]}
              >
                <Select placeholder="请选择供应商类型">
                  <Select.Option value="manufacturer">生产商</Select.Option>
                  <Select.Option value="distributor">分销商</Select.Option>
                  <Select.Option value="retailer">零售商</Select.Option>
                  <Select.Option value="service">服务商</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="status"
                label="供应商状态"
                rules={[{ required: true, message: '请选择供应商状态' }]}
              >
                <Select placeholder="请选择供应商状态">
                  <Select.Option value="active">合作中</Select.Option>
                  <Select.Option value="inactive">停用</Select.Option>
                  <Select.Option value="pending">待审核</Select.Option>
                  <Select.Option value="suspended">暂停</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="contact_person"
                label="联系人"
                rules={[{ required: true, message: '请输入联系人姓名' }]}
              >
                <Input placeholder="请输入联系人姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="联系电话"
                rules={[{ required: true, message: '请输入联系电话' }]}
              >
                <Input placeholder="请输入联系电话" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="email" label="邮箱地址">
                <Input placeholder="请输入邮箱地址" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="payment_terms" label="付款条件">
                <Select placeholder="请选择付款条件">
                  <Select.Option value="预付款">预付款</Select.Option>
                  <Select.Option value="货到付款">货到付款</Select.Option>
                  <Select.Option value="月结30天">月结30天</Select.Option>
                  <Select.Option value="月结60天">月结60天</Select.Option>
                  <Select.Option value="月结90天">月结90天</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="bank_account" label="银行账户">
                <Input placeholder="请输入银行账户信息" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="tax_number" label="税号">
                <Input placeholder="请输入税务登记号" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="address" label="联系地址">
            <Input.TextArea rows={3} placeholder="请输入详细联系地址" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Suppliers 