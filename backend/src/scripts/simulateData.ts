import dayjs from 'dayjs'
import path from 'path'
import sqlite3 from 'sqlite3'

// 目标：当月流水约 80万 RMB，支持环境变量覆盖
const TARGET_RMB = Number(process.env.SIM_RMB || 800000)
// 汇率：1 RMB ≈ X ZAR，可通过环境变量覆盖
const ZAR_PER_RMB = Number(process.env.SIM_ZAR_PER_RMB || 2.6)
const TARGET_ZAR = TARGET_RMB * ZAR_PER_RMB

const dbPath = path.join(process.cwd(), 'database/wms.db')
const db = new sqlite3.Database(dbPath)

function runAsync(sql: string, params: any[] = []): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err)
      else resolve()
    })
  })
}

function allAsync<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err)
      else resolve(rows as T[])
    })
  })
}

async function main() {
  console.log('▶ 开始模拟当月流水数据...')
  const start = dayjs().startOf('month')
  const end = dayjs().endOf('month')
  const days = end.date()

  // 基础数据（带成本价）
  const items = await allAsync<{ id: number; code: string; name: string; sale_price: number; purchase_price: number; unit: string }>(
    'SELECT id, code, name, sale_price, purchase_price, unit FROM items'
  )
  const customers = await allAsync<{ id: number }>('SELECT id FROM customers')
  const warehouses = await allAsync<{ id: number }>('SELECT id FROM warehouses')

  if (items.length === 0 || warehouses.length === 0) {
    throw new Error('缺少基础数据：items 或 warehouses 为空')
  }

  const warehouseId = warehouses[0].id

  // 生成每天目标ZAR
  const dailyTargets: number[] = []
  const dailyAvg = TARGET_ZAR / days
  for (let d = 1; d <= days; d++) {
    const noise = (Math.random() * 0.3 - 0.15)
    const val = Math.max(0, dailyAvg * (1 + noise))
    dailyTargets.push(val)
  }
  const sum = dailyTargets.reduce((s, v) => s + v, 0)
  const factor = TARGET_ZAR / (sum || 1)
  for (let i = 0; i < dailyTargets.length; i++) dailyTargets[i] *= factor

  await runAsync('BEGIN')
  try {
    await runAsync("DELETE FROM sales_order_items WHERE order_id IN (SELECT id FROM sales_orders WHERE strftime('%Y-%m', order_date)=strftime('%Y-%m','now') AND remarks LIKE '%SIMULATED%')")
    await runAsync("DELETE FROM sales_orders WHERE strftime('%Y-%m', order_date)=strftime('%Y-%m','now') AND remarks LIKE '%SIMULATED%'")

    for (let d = 1; d <= days; d++) {
      const date = start.date(d).format('YYYY-MM-DD')
      let remaining = dailyTargets[d - 1]

      while (remaining > 0) {
        const linesCount = 2 + Math.floor(Math.random() * 5)
        const orderItems = [] as { item: typeof items[number]; qty: number; sp: number; cp: number; total: number; cost: number }[]

        for (let i = 0; i < linesCount; i++) {
          const item = items[Math.floor(Math.random() * items.length)]
          const sp = item.sale_price
          const cp = item.purchase_price || sp * 0.7
          const qty = 1 + Math.floor(Math.random() * 3)
          const total = sp * qty
          const cost = cp * qty
          orderItems.push({ item, qty, sp, cp, total, cost })
        }
        const orderAmount = orderItems.reduce((s, l) => s + l.total, 0)
        const take = Math.min(orderAmount, remaining)
        remaining -= take
        if (take <= 0) break

        const customerId = customers.length ? customers[Math.floor(Math.random() * customers.length)].id : null
        await runAsync(
          'INSERT INTO sales_orders (order_no, customer_id, warehouse_id, order_date, total_amount, total_cost, gross_profit, profit_margin, status, remarks, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
          [
            `SO-${date.replace(/-/g, '')}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
            customerId,
            warehouseId,
            date,
            take,
            orderItems.reduce((s,l)=>s+l.cost,0),
            take - orderItems.reduce((s,l)=>s+l.cost,0),
            0,
            'pending',
            'SIMULATED',
            dayjs(date).format('YYYY-MM-DD HH:mm:ss'),
            dayjs(date).format('YYYY-MM-DD HH:mm:ss'),
          ]
        )
        const row = await allAsync<{ id: number }>('SELECT last_insert_rowid() as id')
        const orderId = row[0].id

        for (const l of orderItems) {
          await runAsync(
            'INSERT INTO sales_order_items (order_id, item_id, quantity, unit_price, unit_cost, total_price, total_cost, delivered_quantity) VALUES (?,?,?,?,?,?,?,?)',
            [orderId, l.item.id, l.qty, l.sp, l.cp, l.total, l.cost, 0]
          )
          await runAsync(
            'INSERT INTO inventory_transactions (item_id, warehouse_id, transaction_type, reference_no, reference_type, quantity, unit_cost, transaction_date, remarks) VALUES (?,?,?,?,?,?,?,?,?)',
            [l.item.id, warehouseId, 'OUT', `SO-${orderId}`, 'SALES', -l.qty, l.cp, date, 'SIMULATED']
          )
          await runAsync(
            'UPDATE inventory SET quantity = quantity - ?, available_quantity = available_quantity - ?, last_updated=CURRENT_TIMESTAMP WHERE item_id=? AND warehouse_id=?',
            [l.qty, l.qty, l.item.id, warehouseId]
          )
        }
      }
    }

    await runAsync('COMMIT')
    console.log('✅ 模拟数据生成完成：当月目标', TARGET_RMB, 'RMB (≈', TARGET_ZAR.toFixed(2), 'ZAR)')
  } catch (e) {
    await runAsync('ROLLBACK')
    console.error('❌ 生成失败:', e)
    process.exit(1)
  } finally {
    db.close()
  }
}

main().catch(err => { console.error(err); process.exit(1) }) 