import {
    PlusOutlined,
    SearchOutlined
} from '@ant-design/icons'
import {
    Button,
    Col, Form, Input, message, Modal, Row, Select, Table, Tag
} from 'antd'
import React, { useEffect, useState } from 'react'
import { customersAPI } from '../services/api'

interface Customer {
  id: number
  code: string
  name: string
  customer_type: string
  contact_person: string
  phone: string
  email: string
  address: string
  credit_limit: number
  payment_terms: string
  status: string
  created_at: string
  updated_at: string
}

const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  })

  const [searchFilters, setSearchFilters] = useState({
    customer_type: '',
    status: '',
    keyword: ''
  })

  const [form] = Form.useForm()

  useEffect(() => {
    fetchCustomers()
  }, [pagination.current, pagination.pageSize, searchFilters])

  const fetchCustomers = async () => {
    setLoading(true)
    try {
      const params = {
        page: pagination.current,
        pageSize: pagination.pageSize,
        ...Object.fromEntries(Object.entries(searchFilters).filter(([, v]) => v !== ''))
      }
      const response = await customersAPI.getCustomers(params)
      setCustomers(response.data.data)
      setPagination(prev => ({ ...prev, total: response.data.total }))
    } catch (error) {
      message.error('获取客户列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      
      const formData = {
        ...values,
        credit_limit: values.credit_limit || 0
      }

      if (editingCustomer) {
        await customersAPI.updateCustomer(editingCustomer.id, formData)
        message.success('客户信息更新成功')
      } else {
        await customersAPI.createCustomer(formData)
        message.success('客户添加成功')
      }
      
      setModalVisible(false)
      setEditingCustomer(null)
      form.resetFields()
      fetchCustomers()
    } catch (error: any) {
      if (error.response) {
        message.error(error.response.data?.error || '操作失败')
      }
    }
  }

  const handleEdit = (record: Customer) => {
    setEditingCustomer(record)
    form.setFieldsValue(record)
    setModalVisible(true)
  }

  const handleDelete = async (id: number) => {
    try {
      await customersAPI.deleteCustomer(id)
      message.success('客户删除成功')
      fetchCustomers()
    } catch (error: any) {
      message.error(error.response?.data?.error || '删除失败')
    }
  }

  const getCustomerTypeColor = (type: string) => {
    switch (type) {
      case 'retail': return 'blue'
      case 'wholesale': return 'green'
      case 'corporate': return 'purple'
      default: return 'default'
    }
  }

  const getCustomerTypeText = (type: string) => {
    switch (type) {
      case 'retail': return '零售'
      case 'wholesale': return '批发'
      case 'corporate': return '企业'
      default: return type
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'green'
      case 'inactive': return 'red'
      case 'pending': return 'orange'
      default: return 'default'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return '活跃'
      case 'inactive': return '停用'
      case 'pending': return '待审核'
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
      title: '客户信息',
      key: 'customerInfo',
      width: 180,
      render: (record: Customer) => (
        <div>
          <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{record.name}</div>
          <div style={{ color: '#666', fontSize: '12px' }}>联系人: {record.contact_person}</div>
        </div>
      ),
    },
    {
      title: '联系方式',
      key: 'contactInfo',
      width: 140,
      render: (record: Customer) => (
        <div style={{ fontSize: '12px' }}>
          <div>{record.phone}</div>
          <div style={{ color: '#666' }}>{record.email}</div>
        </div>
      ),
    },
    {
      title: '类型',
      dataIndex: 'customer_type',
      key: 'customer_type',
      width: 80,
      render: (type: string) => (
        <Tag color={getCustomerTypeColor(type)} style={{ fontSize: '11px' }}>
          {getCustomerTypeText(type)}
        </Tag>
      ),
    },
    {
      title: '信用额度',
      dataIndex: 'credit_limit',
      key: 'credit_limit',
      width: 100,
      render: (limit: number) => (
        <div style={{ textAlign: 'right', fontSize: '12px' }}>
          {limit > 0 ? `¥${limit.toLocaleString()}` : '无限制'}
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 70,
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
      render: (record: Customer) => (
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
                content: `确定要删除客户 "${record.name}" 吗？`,
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
        <h1>客户管理</h1>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingCustomer(null)
            form.resetFields()
            setModalVisible(true)
          }}
        >
          新增客户
        </Button>
      </div>

      {/* 搜索筛选区域 */}
      <div className="form-container" style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col span={6}>
            <Input
              placeholder="搜索客户名称/编码/联系人"
              allowClear
              value={searchFilters.keyword}
              onChange={(e) => setSearchFilters({ ...searchFilters, keyword: e.target.value })}
              prefix={<SearchOutlined />}
            />
          </Col>
          <Col span={4}>
            <Select
              placeholder="客户类型"
              allowClear
              style={{ width: '100%' }}
              value={searchFilters.customer_type}
              onChange={(value) => setSearchFilters({ ...searchFilters, customer_type: value || '' })}
            >
              <Select.Option value="retail">零售客户</Select.Option>
              <Select.Option value="wholesale">批发客户</Select.Option>
              <Select.Option value="corporate">企业客户</Select.Option>
            </Select>
          </Col>
          <Col span={4}>
            <Select
              placeholder="客户状态"
              allowClear
              style={{ width: '100%' }}
              value={searchFilters.status}
              onChange={(value) => setSearchFilters({ ...searchFilters, status: value || '' })}
            >
              <Select.Option value="active">活跃</Select.Option>
              <Select.Option value="inactive">停用</Select.Option>
              <Select.Option value="pending">待审核</Select.Option>
            </Select>
          </Col>
          <Col span={3}>
            <Button 
              type="primary"
              icon={<SearchOutlined />}
              onClick={fetchCustomers}
            >
              搜索
            </Button>
          </Col>
        </Row>
      </div>

      <div className="table-container">
        <Table
          columns={columns}
          dataSource={customers}
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

      {/* 新增/编辑客户Modal */}
      <Modal
        title={editingCustomer ? '编辑客户信息' : '新增客户'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => {
          setModalVisible(false)
          setEditingCustomer(null)
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
                label="客户编码"
                rules={[{ required: true, message: '请输入客户编码' }]}
              >
                <Input placeholder="请输入客户编码" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="name"
                label="客户名称"
                rules={[{ required: true, message: '请输入客户名称' }]}
              >
                <Input placeholder="请输入客户名称" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="customer_type"
                label="客户类型"
                rules={[{ required: true, message: '请选择客户类型' }]}
              >
                <Select placeholder="请选择客户类型">
                  <Select.Option value="retail">零售客户</Select.Option>
                  <Select.Option value="wholesale">批发客户</Select.Option>
                  <Select.Option value="corporate">企业客户</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="status"
                label="客户状态"
                rules={[{ required: true, message: '请选择客户状态' }]}
              >
                <Select placeholder="请选择客户状态">
                  <Select.Option value="active">活跃</Select.Option>
                  <Select.Option value="inactive">停用</Select.Option>
                  <Select.Option value="pending">待审核</Select.Option>
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
              <Form.Item name="credit_limit" label="信用额度 (¥)">
                <Input
                  type="number"
                  placeholder="0表示无限制"
                  min={0}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="payment_terms" label="付款条件">
                <Select placeholder="请选择付款条件">
                  <Select.Option value="现金">现金</Select.Option>
                  <Select.Option value="月结30天">月结30天</Select.Option>
                  <Select.Option value="月结60天">月结60天</Select.Option>
                  <Select.Option value="月结90天">月结90天</Select.Option>
                </Select>
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

export default Customers 