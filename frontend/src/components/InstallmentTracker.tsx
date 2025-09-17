import { CalendarOutlined, DollarOutlined, UserOutlined, WarningOutlined } from '@ant-design/icons'
import { Badge, Card, Col, List, Row, Statistic, Tag, Typography } from 'antd'
import React, { useEffect, useState } from 'react'
import { paymentsAPI } from '../services/api'
import { formatCurrencyZAR } from '../utils/currency'

const { Title, Text } = Typography

interface InstallmentPayment {
  id: number
  order_id: number
  order_no: string
  customer_name: string
  installment_no: number
  total_installments: number
  amount: number
  due_date: string
  paid_amount: number
  status: string
}

const InstallmentTracker: React.FC = () => {
  const [installments, setInstallments] = useState<InstallmentPayment[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchPendingInstallments()
  }, [])

  const fetchPendingInstallments = async () => {
    setLoading(true)
    try {
      const response = await paymentsAPI.getPendingInstallments()
      setInstallments(response.data)
    } catch (error) {
      console.error('获取待还款记录失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'orange'
      case 'overdue': return 'red'
      case 'partial': return 'blue'
      default: return 'default'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '待还款'
      case 'overdue': return '逾期'
      case 'partial': return '部分还款'
      default: return status
    }
  }

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date()
  }

  const totalPendingAmount = installments.reduce((sum, item) => sum + (item.amount - item.paid_amount), 0)
  const overdueCount = installments.filter(item => isOverdue(item.due_date)).length
  const thisWeekDue = installments.filter(item => {
    const due = new Date(item.due_date)
    const today = new Date()
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
    return due >= today && due <= weekFromNow
  }).length

  return (
    <Card 
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <DollarOutlined />
          <span>待还款跟踪</span>
          {installments.length > 0 && (
            <Badge count={installments.length} style={{ backgroundColor: '#52c41a' }} />
          )}
        </div>
      }
      size="small"
    >
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Statistic
            title="待还款总额"
            value={totalPendingAmount}
            precision={2}
            prefix="R"
            valueStyle={{ color: '#cf1322' }}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="逾期笔数"
            value={overdueCount}
            suffix="笔"
            valueStyle={{ color: overdueCount > 0 ? '#cf1322' : '#3f8600' }}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="本周到期"
            value={thisWeekDue}
            suffix="笔"
            valueStyle={{ color: thisWeekDue > 0 ? '#fa8c16' : '#3f8600' }}
          />
        </Col>
      </Row>

      <List
        loading={loading}
        dataSource={installments}
        locale={{ emptyText: '暂无待还款记录' }}
        renderItem={(item) => (
          <List.Item
            style={{
              backgroundColor: isOverdue(item.due_date) ? '#fff2f0' : 'transparent',
              padding: '8px 12px',
              margin: '4px 0',
              borderRadius: '4px',
              border: isOverdue(item.due_date) ? '1px solid #ffccc7' : '1px solid #f0f0f0'
            }}
          >
            <List.Item.Meta
              avatar={
                isOverdue(item.due_date) ? (
                  <WarningOutlined style={{ color: '#cf1322', fontSize: '16px' }} />
                ) : (
                  <CalendarOutlined style={{ color: '#1890ff', fontSize: '16px' }} />
                )
              }
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>
                    <Text strong>{item.order_no}</Text>
                    <Text style={{ marginLeft: 8, fontSize: '12px', color: '#666' }}>
                      第{item.installment_no}期 / 共{item.total_installments}期
                    </Text>
                  </span>
                  <div>
                    <Text strong style={{ color: '#cf1322' }}>
                      {formatCurrencyZAR(item.amount - item.paid_amount)}
                    </Text>
                    {item.paid_amount > 0 && (
                      <Text style={{ marginLeft: 8, fontSize: '12px', color: '#666' }}>
                        (已付: {formatCurrencyZAR(item.paid_amount)})
                      </Text>
                    )}
                  </div>
                </div>
              }
              description={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>
                    <UserOutlined style={{ marginRight: 4 }} />
                    {item.customer_name}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      到期: {new Date(item.due_date).toLocaleDateString()}
                    </Text>
                    <Tag color={getStatusColor(item.status)} size="small">
                      {getStatusText(item.status)}
                    </Tag>
                    {isOverdue(item.due_date) && (
                      <Tag color="red" size="small">逾期</Tag>
                    )}
                  </div>
                </div>
              }
            />
          </List.Item>
        )}
      />
    </Card>
  )
}

export default InstallmentTracker
