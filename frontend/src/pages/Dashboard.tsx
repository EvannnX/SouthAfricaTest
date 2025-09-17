import {
  DollarOutlined,
  ShoppingOutlined,
  TrophyOutlined,
  WarningOutlined
} from '@ant-design/icons'
import { Alert, Card, Col, Row, Statistic } from 'antd'
import ReactECharts from 'echarts-for-react'
import React, { useEffect, useState } from 'react'
import InstallmentTracker from '../components/InstallmentTracker'
import { reportsAPI } from '../services/api'

interface DashboardData {
  inventory_value: number
  today_sales: number
  today_profit: number
  month_sales: number
  month_profit: number
  avg_margin: number
  pending_purchase_orders: number
  pending_sales_orders: number
  inventory_alerts: number
}

const Dashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [salesTrend, setSalesTrend] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
    fetchSalesTrend()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await reportsAPI.getDashboardData()
      setDashboardData(response.data)
    } catch (error) {
      console.error('获取仪表板数据失败:', error)
    }
  }

  const fetchSalesTrend = async () => {
    try {
      const response = await reportsAPI.getSalesTrend()
      setSalesTrend(response.data)
      setLoading(false)
    } catch (error) {
      console.error('获取销售趋势失败:', error)
      setLoading(false)
    }
  }

  const salesTrendOption = {
    title: {
      text: '近30天销售趋势',
      textStyle: { fontSize: 16 }
    },
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['销售额', '毛利润'],
      textStyle: { fontSize: 12 }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: salesTrend.map(item => item.date),
      axisLabel: { fontSize: 10 }
    },
    yAxis: {
      type: 'value',
      axisLabel: { fontSize: 10 }
    },
    series: [
      {
        name: '销售额',
        type: 'line',
        data: salesTrend.map(item => item.sales_amount || 0),
        smooth: true,
        lineStyle: { width: 2 }
      },
      {
        name: '毛利润',
        type: 'line',
        data: salesTrend.map(item => item.profit_amount || 0),
        smooth: true,
        lineStyle: { width: 2 }
      }
    ]
  }

  if (loading) {
    return <div style={{ padding: 24, textAlign: 'center' }}>加载中...</div>
  }

  return (
    <div>
      <div className="page-header">
        <h1>仪表板</h1>
      </div>

      {/* 库存预警 */}
      {dashboardData && dashboardData.inventory_alerts > 0 && (
        <Alert
          message={`您有 ${dashboardData.inventory_alerts} 个库存预警，请及时处理`}
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {/* 今日概览 */}
      <div className="dashboard-section">
        <h3>📊 今日概览</h3>
        <Row gutter={[12, 12]}>
          <Col xs={12} sm={12} md={6}>
            <Card size="small">
              <Statistic
                title="今日销售额"
                value={dashboardData?.today_sales || 0}
                precision={2}
                valueStyle={{ color: '#3f8600', fontSize: '20px' }}
                prefix={<DollarOutlined />}
                suffix="元"
              />
            </Card>
          </Col>
          <Col xs={12} sm={12} md={6}>
            <Card size="small">
              <Statistic
                title="今日毛利润"
                value={dashboardData?.today_profit || 0}
                precision={2}
                valueStyle={{ color: '#cf1322', fontSize: '20px' }}
                prefix={<TrophyOutlined />}
                suffix="元"
              />
            </Card>
          </Col>
          <Col xs={12} sm={12} md={6}>
            <Card size="small">
              <Statistic
                title="库存总价值"
                value={dashboardData?.inventory_value || 0}
                precision={2}
                valueStyle={{ fontSize: '20px' }}
                prefix={<ShoppingOutlined />}
                suffix="元"
              />
            </Card>
          </Col>
          <Col xs={12} sm={12} md={6}>
            <Card size="small">
              <Statistic
                title="库存预警"
                value={dashboardData?.inventory_alerts || 0}
                valueStyle={{ 
                  color: dashboardData?.inventory_alerts ? '#cf1322' : '#3f8600',
                  fontSize: '20px'
                }}
                prefix={<WarningOutlined />}
                suffix="项"
              />
            </Card>
          </Col>
        </Row>
      </div>

      {/* 本月统计 */}
      <div className="dashboard-section">
        <h3>📈 本月统计</h3>
        <Row gutter={[12, 12]}>
          <Col xs={12} sm={6} md={6}>
            <Card size="small">
              <Statistic
                title="本月销售额"
                value={dashboardData?.month_sales || 0}
                precision={2}
                valueStyle={{ fontSize: '18px' }}
                prefix="¥"
              />
            </Card>
          </Col>
          <Col xs={12} sm={6} md={6}>
            <Card size="small">
              <Statistic
                title="本月毛利润"
                value={dashboardData?.month_profit || 0}
                precision={2}
                valueStyle={{ fontSize: '18px' }}
                prefix="¥"
              />
            </Card>
          </Col>
          <Col xs={12} sm={6} md={6}>
            <Card size="small">
              <Statistic
                title="平均毛利率"
                value={dashboardData?.avg_margin || 0}
                precision={2}
                valueStyle={{ fontSize: '18px' }}
                suffix="%"
              />
            </Card>
          </Col>
          <Col xs={12} sm={6} md={6}>
            <Card size="small">
              <Statistic
                title="待处理订单"
                value={(dashboardData?.pending_purchase_orders || 0) + (dashboardData?.pending_sales_orders || 0)}
                valueStyle={{ fontSize: '18px' }}
                suffix="个"
              />
            </Card>
          </Col>
        </Row>
      </div>

      {/* 待还款跟踪和销售趋势 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={8}>
          <InstallmentTracker />
        </Col>
        <Col xs={24} lg={16}>
          <Card title="📊 销售趋势分析" size="small">
            <ReactECharts 
              option={salesTrendOption} 
              style={{ height: '300px', width: '100%' }}
              opts={{ renderer: 'canvas' }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard