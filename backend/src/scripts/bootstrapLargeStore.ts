import dayjs from 'dayjs'
import path from 'path'
import sqlite3 from 'sqlite3'

const dbPath = path.join(process.cwd(), 'database/wms.db')
const db = new sqlite3.Database(dbPath)

// 参数：起始年月、汇率、库存价值上限（人民币）
const START_YM = process.env.START_YM || '2024-06'
const ZAR_PER_RMB = Number(process.env.ZAR_PER_RMB || 2.6)
const INV_CAP_RMB = Number(process.env.INV_CAP_RMB || 7000000)
const INV_CAP_ZAR = INV_CAP_RMB * ZAR_PER_RMB
const INIT_INV_RATIO = Number(process.env.INIT_INV_RATIO || 0.45) // 初始库存占上限比例，默认45%
const INIT_INV_CAP_ZAR = INV_CAP_ZAR * INIT_INV_RATIO

function run(sql: string, params: any[] = []): Promise<void> {
  return new Promise((resolve, reject) => db.run(sql, params, (e)=> e?reject(e):resolve()))
}
function all<T=any>(sql: string, params: any[] = []): Promise<T[]> {
  return new Promise((resolve, reject)=> db.all(sql, params, (e,rows)=> e?reject(e):resolve(rows as T[])))
}

async function getInventoryValueZAR(): Promise<number> {
  const rows = await all<{ quantity:number; avg_cost:number }>(`SELECT quantity, avg_cost FROM inventory`)
  return rows.reduce((s,r)=> s + Number(r.quantity||0)*Number(r.avg_cost||0), 0)
}

async function cleanupEnrichData() {
  // 清理标记为 ENRICH 的历史记录，避免重复叠加
  await run("DELETE FROM purchase_order_items WHERE order_id IN (SELECT id FROM purchase_orders WHERE remarks='ENRICH')")
  await run("DELETE FROM sales_order_items WHERE order_id IN (SELECT id FROM sales_orders WHERE remarks='ENRICH')")
  await run("DELETE FROM purchase_orders WHERE remarks='ENRICH'")
  await run("DELETE FROM sales_orders WHERE remarks='ENRICH'")
  await run("DELETE FROM inventory_transactions WHERE remarks='ENRICH'")
  // 重新铺货前清空库存（保留结构）
  await run("DELETE FROM inventory")
}

async function ensureBase() {
  await run("INSERT OR IGNORE INTO warehouses (code,name,address,manager,status) VALUES ('WH001','主仓库','Johannesburg','Mike','active')")
  await run("INSERT OR IGNORE INTO warehouses (code,name,address,manager,status) VALUES ('WH002','分仓库','Cape Town','John','active')")
  await run("INSERT OR IGNORE INTO customers (code,name,contact_person,phone,customer_type,status) VALUES ('CUS003','Pick n Pay Retail','Peter','0820000003','retail','active')")
  await run("INSERT OR IGNORE INTO customers (code,name,contact_person,phone,customer_type,status) VALUES ('CUS004','Makro Wholesale','Linda','0820000004','wholesale','active')")
  await run("INSERT OR IGNORE INTO customers (code,name,contact_person,phone,customer_type,status) VALUES ('CUS005','Massmart Corporate','Ben','0820000005','corporate','active')")
  await run("INSERT OR IGNORE INTO customers (code,name,contact_person,phone,customer_type,status) VALUES ('CUS006','Game Store','Lucy','0820000006','retail','active')")
  await run("INSERT OR IGNORE INTO suppliers (code,name,contact_person,phone,status) VALUES ('SUP003','Hisense 南非分公司','Lee','011-100-1003','active')")
  await run("INSERT OR IGNORE INTO suppliers (code,name,contact_person,phone,status) VALUES ('SUP004','Samsung Africa','Kim','011-100-1004','active')")
}

type ItemSeed = { prefix:string; models:string[]; unit:string; buy:number; sell:number; qty:[number,number] }

function* generateItems(): Generator<{code:string; name:string; unit:string; purchase:number; sale:number}> {
  const groups: ItemSeed[] = [
    { prefix:'AC', unit:'台', buy:2200, sell:2899, qty:[20,120], models:['GREE 1.5HP Inverter','GREE 2HP Inverter','Hisense 1.5HP'] },
    { prefix:'TV', unit:'台', buy:2800, sell:3599, qty:[20,120], models:['Hisense 55" 4K','Hisense 65" 4K','Samsung 55" QLED','Samsung 65" QLED'] },
    { prefix:'WM', unit:'台', buy:1800, sell:2399, qty:[20,120], models:['Little Swan 8kg','Little Swan 10kg','Samsung 9kg'] },
    { prefix:'RF', unit:'台', buy:2400, sell:3199, qty:[15,100], models:['Midea 516L','Hisense 450L','Samsung 500L'] },
    { prefix:'MW', unit:'台', buy:400, sell:699, qty:[50,200], models:['Midea 20L','Samsung 23L','Hisense 25L'] },
    { prefix:'DW', unit:'台', buy:2200, sell:2999, qty:[10,80], models:['Hisense 12 Sets','Samsung 14 Sets'] },
    { prefix:'SA', unit:'件', buy:120, sell:199, qty:[200,800], models:['Kettle 1.7L','Blender 1.5L','Steam Iron','Toaster 4-Slice','Vacuum Cleaner'] },
    { prefix:'ACC', unit:'件', buy:20, sell:49, qty:[500,2000], models:['HDMI Cable 2m','Power Strip 6-way','AA Battery 4-pack','TV Wall Mount','TV Remote','Water Filter','Antenna Cable 5m','Surge Protector'] },
  ]
  let num=1
  for (const g of groups) {
    for (const m of g.models) {
      const code = `${g.prefix}${num.toString().padStart(3,'0')}`
      num++
      yield { code, name: m, unit:g.unit, purchase:g.buy, sale:g.sell }
    }
  }
}

async function upsertItems() {
  for (const it of generateItems()) {
    await run(`INSERT OR IGNORE INTO items (code,name,category,unit,purchase_price,sale_price,min_stock,max_stock,status) VALUES (?,?,?,?,?,?,?,?,?)`,
      [it.code, it.name, it.code.substring(0,3), it.unit, it.purchase, it.sale, 10, 500, 'active'])
  }
}

async function seedInventory() {
  const items = await all<{id:number; code:string; purchase_price:number}>(`SELECT id, code, purchase_price FROM items`)
  const warehouses = await all<{id:number}>(`SELECT id FROM warehouses`)
  for (const w of warehouses) {
    for (const it of items) {
      const currentVal = await getInventoryValueZAR()
      if (currentVal >= INIT_INV_CAP_ZAR) return
      const base = it.code.startsWith('ACC') ? 800 : it.code.startsWith('SA') ? 300 : 80
      const desired = base + Math.floor(Math.random() * base)
      const remainingZar = Math.max(0, INIT_INV_CAP_ZAR - currentVal)
      const maxByCap = Math.floor(remainingZar / Math.max(1, it.purchase_price))
      const qty = Math.max(0, Math.min(desired, maxByCap))
      if (qty<=0) continue
      await run(`INSERT INTO inventory (item_id, warehouse_id, quantity, available_quantity, reserved_quantity, avg_cost, last_updated) VALUES (?,?,?,?,?,?,CURRENT_TIMESTAMP)`,
        [it.id, w.id, qty, qty, 0, it.purchase_price])
    }
  }
}

async function createPurchase(orderDate:string, warehouseId:number, itemsPick:{id:number; price:number}[]) {
  const orderNo = `PO-${orderDate.replace(/-/g,'')}-${Math.floor(Math.random()*10000).toString().padStart(4,'0')}`
  await run(`INSERT INTO purchase_orders (order_no, supplier_id, warehouse_id, order_date, expected_date, total_amount, status, remarks, created_at, updated_at) VALUES (?,?,?,?,?,?, 'received','ENRICH', ?, ?)`,
    [orderNo, 1, warehouseId, orderDate, orderDate, 0, orderDate, orderDate])
  const row = await all<{id:number}>(`SELECT last_insert_rowid() as id`)
  const orderId = row[0].id

  for (const pick of itemsPick) {
    const currentVal = await getInventoryValueZAR()
    if (currentVal >= INV_CAP_ZAR) break
    const remainingZAR = Math.max(0, INV_CAP_ZAR - currentVal)
    const maxQtyByCap = Math.floor(remainingZAR / Math.max(1, pick.price))

    const desired = 20 + Math.floor(Math.random()*80)
    const qty = Math.max(0, Math.min(desired, maxQtyByCap))
    if (qty <= 0) continue

    const unit = pick.price
    const total = qty * unit
    await run(`INSERT INTO purchase_order_items (order_id, item_id, quantity, unit_price, total_price, received_quantity) VALUES (?,?,?,?,?,?)`,
      [orderId, pick.id, qty, unit, total, qty])
    await run(`INSERT INTO inventory_transactions (item_id, warehouse_id, transaction_type, reference_no, reference_type, quantity, unit_cost, transaction_date, remarks) VALUES (?,?,?,?,?,?,?,?,?)`,
      [pick.id, warehouseId, 'IN', orderNo, 'PURCHASE', qty, unit, orderDate, 'ENRICH'])
    await run(`UPDATE inventory SET quantity=quantity+?, available_quantity=available_quantity+?, avg_cost=? , last_updated=CURRENT_TIMESTAMP WHERE item_id=? AND warehouse_id=?`,
      [qty, qty, unit, pick.id, warehouseId])
  }
}

async function createSale(orderDate:string, warehouseId:number, itemsPick:{id:number; price:number; cost:number}[]) {
  const orderNo = `SO-${orderDate.replace(/-/g,'')}-${Math.floor(Math.random()*10000).toString().padStart(4,'0')}`
  await run(`INSERT INTO sales_orders (order_no, customer_id, warehouse_id, order_date, total_amount, total_cost, gross_profit, profit_margin, status, remarks, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?, 'completed', 'ENRICH', ?, ?)`,
    [orderNo, 1, warehouseId, orderDate, 0, 0, 0, 0, orderDate, orderDate])
  const row = await all<{id:number}>(`SELECT last_insert_rowid() as id`)
  const orderId = row[0].id

  let total = 0, costSum = 0
  for (const pick of itemsPick) {
    const inv = await all<{available_quantity:number}>(`SELECT available_quantity FROM inventory WHERE item_id=? AND warehouse_id=?`,[pick.id, warehouseId])
    if (!inv.length || inv[0].available_quantity<=0) continue
    const weekday = dayjs(orderDate).day()
    const seasonFactor = [1.0,1.05,1.1,1.15,1.2,1.05,0.95,0.9,0.95,1.0,1.05,1.1][dayjs(orderDate).month()]
    const weekFactor = (weekday===6||weekday===0) ? 1.3 : 1.0
    const baseMax = 5 + Math.floor(Math.random()*15)
    const maxQty = Math.floor(Math.min(inv[0].available_quantity, baseMax * seasonFactor * weekFactor))
    const qty = Math.max(1, Math.floor(maxQty * (0.3 + Math.random()*0.7)))
    if (qty<=0) continue

    const lineTotal = pick.price * qty
    const lineCost = pick.cost * qty
    await run(`INSERT INTO sales_order_items (order_id, item_id, quantity, unit_price, unit_cost, total_price, total_cost, delivered_quantity) VALUES (?,?,?,?,?,?,?,?)`,
      [orderId, pick.id, qty, pick.price, pick.cost, lineTotal, lineCost, qty])
    await run(`INSERT INTO inventory_transactions (item_id, warehouse_id, transaction_type, reference_no, reference_type, quantity, unit_cost, transaction_date, remarks) VALUES (?,?,?,?,?,?,?,?,?)`,
      [pick.id, warehouseId, 'OUT', orderNo, 'SALES', -qty, pick.cost, orderDate, 'ENRICH'])
    await run(`UPDATE inventory SET quantity=quantity-?, available_quantity=available_quantity-?, last_updated=CURRENT_TIMESTAMP WHERE item_id=? AND warehouse_id=?`,
      [qty, qty, pick.id, warehouseId])
    total += lineTotal; costSum += lineCost
  }
  await run(`UPDATE sales_orders SET total_amount=?, total_cost=?, gross_profit=?, profit_margin=? WHERE id=?`,
    [total, costSum, total-costSum, total? ((total-costSum)/total*100):0, orderId])
}

async function main() {
  console.log('▶ 扩充大型门店模拟数据(参数化)...')
  await cleanupEnrichData()
  await ensureBase()
  await upsertItems()
  await seedInventory()

  const items = await all<{id:number; purchase_price:number; sale_price:number}>(`SELECT id, purchase_price, sale_price FROM items`)
  const warehouses = await all<{id:number}>(`SELECT id FROM warehouses`)

  const start = dayjs(START_YM + '-01')
  const end = dayjs()
  let cursor = start.startOf('month')
  while (cursor.isBefore(end, 'month') || cursor.isSame(end, 'month')) {
    const daysInMonth = cursor.daysInMonth()
    for (let d=1; d<=daysInMonth; d++) {
      const date = cursor.date(d).format('YYYY-MM-DD')
      const picksIn = [] as {id:number; price:number}[]
      for (let k=0; k<8; k++) {
        const it = items[Math.floor(Math.random()*items.length)]
        picksIn.push({ id: it.id, price: it.purchase_price })
      }
      for (const w of warehouses) await createPurchase(date, w.id, picksIn)

      const picksOut = [] as {id:number; price:number; cost:number}[]
      for (let k=0; k<18; k++) {
        const it = items[Math.floor(Math.random()*items.length)]
        picksOut.push({ id: it.id, price: it.sale_price, cost: it.purchase_price })
      }
      for (const w of warehouses) await createSale(date, w.id, picksOut)
    }
    cursor = cursor.add(1,'month')
  }
  const invZar = await getInventoryValueZAR()
  console.log(`✅ 扩充完成：自 ${start.format('YYYY-MM')} 起至今的数据已生成。当前库存价值≈ZAR ${invZar.toFixed(2)}（上限ZAR ${INV_CAP_ZAR.toFixed(2)}）。`)
  db.close()
}

main().catch(e=>{ console.error(e); process.exit(1) }) 