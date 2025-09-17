import { Card, Col, DatePicker, message, Row, Space, Table, Tabs } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import ReactECharts from 'echarts-for-react';
import React, { useEffect, useMemo, useState } from 'react';
import { reportsAPI } from '../services/api';
import { getBilingualName } from '../utils/itemNames';

interface SalesTrendPoint { date: string; amount: number }
interface TopItem { code: string; name: string; total_quantity: number; total_sales: number }
interface TopCustomer { name: string; order_count: number; total_sales: number }
interface TurnoverRow { code: string; name: string; current_stock: number; sold_quantity: number; turnover_ratio: number }
interface ProfitRow { item_code?: string; item_name?: string; customer_name?: string; category?: string; total_sales: number; total_cost: number; gross_profit: number; profit_margin: number; total_quantity: number; order_count: number }

const { RangePicker } = DatePicker;

const Reports: React.FC = () => {
  const [activeKey, setActiveKey] = useState('sales')
  const [loading, setLoading] = useState(false)

  // 时间段（默认近30天）
  const [range, setRange] = useState<[Dayjs, Dayjs]>([dayjs().subtract(29, 'day'), dayjs()])

  // 数据状态
  const [salesTrend, setSalesTrend] = useState<SalesTrendPoint[]>([])
  const [topItems, setTopItems] = useState<TopItem[]>([])
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([])
  const [turnover, setTurnover] = useState<TurnoverRow[]>([])
  const [profitRows, setProfitRows] = useState<ProfitRow[]>([])

  const startDate = range[0].format('YYYY-MM-DD')
  const endDate = range[1].format('YYYY-MM-DD')

  useEffect(() => {
    fetchData(activeKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeKey, startDate, endDate])

  const fetchData = async (tab: string) => {
    setLoading(true)
    const params = { start_date: startDate, end_date: endDate }
    try {
      if (tab === 'sales') {
        const [trendRes, itemRes] = await Promise.all([
          reportsAPI.getSalesTrend(params),
          reportsAPI.getTopSellingItems({ ...params, limit: 10 })
        ])
        const trend = (trendRes.data || []).map((r: any) => ({ date: r.date, amount: r.sales_amount || 0 }))
        setSalesTrend(trend)
        setTopItems(itemRes.data || itemRes.data?.data || [])
      } else if (tab === 'customers') {
        const res = await reportsAPI.getTopCustomers({ ...params, limit: 10 })
        setTopCustomers(res.data || res.data?.data || [])
      } else if (tab === 'inventory') {
        const res = await reportsAPI.getInventoryTurnover(params)
        setTurnover(res.data || [])
      } else if (tab === 'profit') {
        const res = await reportsAPI.getProfitAnalysis(params)
        setProfitRows(res.data || res.data?.data || [])
      }
    } catch (e) {
      message.error('加载报表数据失败')
    } finally {
      setLoading(false)
    }
  }

  const salesOption = useMemo(() => {
    const x = salesTrend.map(p => p.date)
    const y = salesTrend.map(p => p.amount)
    return {
      grid: { left: 40, right: 20, top: 30, bottom: 30 },
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: x, axisLabel: { fontSize: 11 } },
      yAxis: { type: 'value', axisLabel: { fontSize: 11 } },
      series: [{ type: 'line', data: y, smooth: true, lineStyle: { width: 3 }, symbol: 'circle' }],
    }
  }, [salesTrend])

  const topItemsColumns = [
    { title: '编码', dataIndex: 'code', key: 'code', width: 100 },
    { title: '货品', key: 'name', render: (r:any)=> {
      const { en, zh } = getBilingualName(r.code, (r as any).en_name || r.name)
      return (
        <div>
          <div style={{ fontWeight: 600 }}>{en}</div>
          {zh && zh !== en && (<div style={{ color:'#888', fontSize:12 }}>{zh}</div>)}
        </div>
      )
    } },
    { title: '销量', dataIndex: 'total_quantity', key: 'total_quantity', width: 100, align: 'right' as const },
    { title: '销售额', dataIndex: 'total_sales', key: 'total_sales', width: 120, align: 'right' as const, render: (v:number)=> `¥${(v||0).toFixed(2)}` },
  ]

  const topCustomersColumns = [
    { title: '客户', dataIndex: 'name', key: 'name' },
    { title: '订单数', dataIndex: 'order_count', key: 'order_count', width: 100, align: 'right' as const },
    { title: '销售额', dataIndex: 'total_sales', key: 'total_sales', width: 120, align: 'right' as const, render: (v:number)=> `¥${(v||0).toFixed(2)}` },
  ]

  const turnoverColumns = [
    { title: '货品', key:'item', render:(r: any)=> {
      const { en, zh } = getBilingualName(r.code, (r as any).en_name || r.name)
      return (
        <div>
          <div style={{ fontWeight: 600 }}>{en}</div>
          {zh && zh !== en && (<div style={{ color:'#888', fontSize:12 }}>{zh}</div>)}
        </div>
      )
    } },
    { title: '周转率', dataIndex:'turnover_ratio', width: 100, align: 'right' as const, render:(v:number)=> (v??0).toFixed(2) },
    { title: '本期销量', dataIndex:'sold_quantity', width: 100, align: 'right' as const },
    { title: '当前库存', dataIndex:'current_stock', width: 100, align: 'right' as const },
  ]

  const profitColumns = [
    { title: '货品/客户/品类', key: 'name', render:(r: ProfitRow)=> {
      if (r.item_name) {
        const { en, zh } = getBilingualName((r as any).code || '', (r as any).en_name || r.item_name)
        return (
          <div>
            <div style={{ fontWeight: 600 }}>{en}</div>
            {zh && zh !== en && (<div style={{ color:'#888', fontSize:12 }}>{zh}</div>)}
          </div>
        )
      }
      return r.customer_name || r.category || ''
    } },
    { title: '销售额', dataIndex: 'total_sales', key: 'total_sales', width: 120, align: 'right' as const, render:(v:number)=> `¥${(v||0).toFixed(2)}` },
    { title: '成本', dataIndex: 'total_cost', key: 'total_cost', width: 120, align: 'right' as const, render:(v:number)=> `¥${(v||0).toFixed(2)}` },
    { title: '毛利润', dataIndex: 'gross_profit', key: 'gross_profit', width: 120, align: 'right' as const, render:(v:number)=> `¥${(v||0).toFixed(2)}` },
    { title: '毛利率', dataIndex: 'profit_margin', key: 'profit_margin', width: 100, align: 'right' as const, render:(v:number)=> {
      const margin = Number(v||0)
      const color = margin>20? '#52c41a' : margin>10? '#faad14' : '#ff4d4f'
      return <span style={{ color, fontWeight: 600 }}>{margin.toFixed(1)}%</span>
    }},
    { title: '销量', dataIndex: 'total_quantity', key: 'total_quantity', width: 100, align: 'right' as const },
    { title: '订单数', dataIndex: 'order_count', key: 'order_count', width: 100, align: 'right' as const },
  ]

  const toolbar = (
    <Space>
      <RangePicker
        value={range}
        onChange={(vals)=> vals && setRange(vals as [Dayjs, Dayjs])}
        allowClear={false}
        format="YYYY-MM-DD"
      />
    </Space>
  )

  const salesTab = (
    <div>
      <Row gutter={[12,12]}>
        <Col xs={24} md={16}>
          <Card size="small" title={<Space>销售趋势{toolbar}</Space>} bodyStyle={{ padding: 8 }}>
            <ReactECharts option={salesOption} style={{ height: 280 }} opts={{ renderer: 'canvas' }} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card size="small" title={<Space>畅销商品TOP10{toolbar}</Space>} bodyStyle={{ padding: 8 }}>
            <Table size="small" rowKey={(r)=>r.code + r.name} columns={topItemsColumns} dataSource={topItems} pagination={false} loading={loading} />
          </Card>
        </Col>
      </Row>
    </div>
  )

  const customersTab = (
    <div className="table-container">
      <Space style={{ marginBottom: 8 }}>{toolbar}</Space>
      <Table size="small" rowKey={(r)=>r.name} columns={topCustomersColumns} dataSource={topCustomers} loading={loading} pagination={{ pageSize: 10 }} />
    </div>
  )

  const inventoryTab = (
    <div>
      <Space style={{ marginBottom: 8 }}>{toolbar}</Space>
      <Row gutter={[12,12]}>
        <Col xs={24} md={24}>
          <Card size="small" title="库存周转" bodyStyle={{ padding: 8 }}>
            <Table size="small" rowKey={(r)=> (r.code||'') + (r.name||'')} columns={turnoverColumns} dataSource={turnover} pagination={{ pageSize: 12 }} loading={loading} />
          </Card>
        </Col>
      </Row>
    </div>
  )

  const profitTab = (
    <div className="table-container">
      <Space style={{ marginBottom: 8 }}>{toolbar}</Space>
      <Table size="small" rowKey={(r)=> (r.item_name || r.customer_name || r.category || '') + (r.total_sales||0)} columns={profitColumns} dataSource={profitRows} loading={loading} pagination={{ pageSize: 12 }} />
    </div>
  )

  const items = [
    { key: 'sales', label: '销售分析', children: salesTab },
    { key: 'customers', label: '客户分析', children: customersTab },
    { key: 'inventory', label: '库存分析', children: inventoryTab },
    { key: 'profit', label: '利润分析', children: profitTab },
  ]

  return (
    <div>
      <div className="page-header">
        <h1>报表分析</h1>
      </div>
      <Tabs items={items} activeKey={activeKey} onChange={setActiveKey} />
    </div>
  )
}

export default Reports 