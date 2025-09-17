import { message } from 'antd'
import axios from 'axios'

// 优先使用环境变量，否则使用代理路径
const API_BASE_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api'

console.log('API_BASE_URL:', API_BASE_URL) // 调试日志

// 创建axios实例
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
})

// 防抖：避免401时全局多次弹窗/多次跳转
let isHandlingUnauthorized = false

// 请求拦截器：添加token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    // 在请求前提前检测token是否将要过期（剩余<60s则视为过期），避免产生一堆失败请求
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1] || ''))
        const exp = Number(payload?.exp || 0)
        const now = Math.floor(Date.now() / 1000)
        if (exp && exp - now < 60 && !isHandlingUnauthorized) {
          isHandlingUnauthorized = true
          message.warning('登录已过期，请重新登录')
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          window.location.href = '/login'
          // 提前终止后续请求
          return Promise.reject(new Error('Token expired'))
        }
      } catch {
        // 忽略解码异常，按无过期处理
      }
    }
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器：处理错误
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      if (!isHandlingUnauthorized) {
        isHandlingUnauthorized = true
        message.warning('登录状态已失效，请重新登录')
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        // 延时避免与当前一批组件更新相互干扰
        setTimeout(() => {
          window.location.href = '/login'
          // 1.5s后释放处理标记，防止后续正常流程被挡住
          setTimeout(() => { isHandlingUnauthorized = false }, 1500)
        }, 100)
      }
      return Promise.reject(error)
    }
    return Promise.reject(error)
  }
)

// 认证API
export const authAPI = {
  login: (credentials: { username: string; password: string }) =>
    api.post('/auth/login', credentials),
  
  getCurrentUser: () =>
    api.get('/auth/me'),
}

// 货品API
export const itemsAPI = {
  getItems: (params?: any) =>
    api.get('/items', { params }),
  
  createItem: (data: any) =>
    api.post('/items', data),
  
  updateItem: (id: number, data: any) =>
    api.put(`/items/${id}`, data),
  
  deleteItem: (id: number) =>
    api.delete(`/items/${id}`),
  
  getCategories: () =>
    api.get('/items/categories/list'),
}

// 供应商API
export const suppliersAPI = {
  getSuppliers: (params?: any) =>
    api.get('/suppliers', { params }),
  
  createSupplier: (data: any) =>
    api.post('/suppliers', data),
  
  updateSupplier: (id: number, data: any) =>
    api.put(`/suppliers/${id}`, data),
  
  deleteSupplier: (id: number) =>
    api.delete(`/suppliers/${id}`),
}

// 客户API
export const customersAPI = {
  getCustomers: (params?: any) =>
    api.get('/customers', { params }),
  
  createCustomer: (data: any) =>
    api.post('/customers', data),
  
  updateCustomer: (id: number, data: any) =>
    api.put(`/customers/${id}`, data),
  
  deleteCustomer: (id: number) =>
    api.delete(`/customers/${id}`),
}

// 仓库API
export const warehousesAPI = {
  getWarehouses: () =>
    api.get('/warehouses'),
  
  createWarehouse: (data: any) =>
    api.post('/warehouses', data),
  
  updateWarehouse: (id: number, data: any) =>
    api.put(`/warehouses/${id}`, data),
  
  deleteWarehouse: (id: number) =>
    api.delete(`/warehouses/${id}`),
}

// 采购API
export const purchasesAPI = {
  getPurchaseOrders: (params?: any) =>
    api.get('/purchases', { params }),
  
  createPurchaseOrder: (data: any) =>
    api.post('/purchases', data),
  
  updatePurchaseOrder: (id: number, data: any) =>
    api.put(`/purchases/${id}`, data),
  
  deletePurchaseOrder: (id: number) =>
    api.delete(`/purchases/${id}`),
  
  getPurchaseOrderDetail: (id: number) =>
    api.get(`/purchases/${id}`),
  
  receivePurchase: (id: number, data: any) =>
    api.post(`/purchases/${id}/receive`, data),
}

// 销售API
export const salesAPI = {
  getSalesOrders: (params?: any) =>
    api.get('/sales', { params }),
  
  createSalesOrder: (data: any) =>
    api.post('/sales', data),
  
  updateSalesOrder: (id: number, data: any) =>
    api.put(`/sales/${id}`, data),
  
  deleteSalesOrder: (id: number) =>
    api.delete(`/sales/${id}`),
  
  getSalesOrderDetail: (id: number) =>
    api.get(`/sales/${id}`),
  
  deliverSalesOrder: (id: number, data: any) =>
    api.post(`/sales/${id}/deliver`, data),
}

// 支付API
export const paymentsAPI = {
  createPayment: (data: any) =>
    api.post('/payments', data),
  
  getPaymentsByOrder: (orderId: number) =>
    api.get(`/payments/order/${orderId}`),
  
  createInstallmentPlan: (data: any) =>
    api.post('/payments/installment', data),
  
  payInstallment: (installmentId: number, data: any) =>
    api.post(`/payments/installment/${installmentId}/pay`, data),
  
  getInstallmentsByOrder: (orderId: number) =>
    api.get(`/payments/installment/order/${orderId}`),
  
  getPendingInstallments: () =>
    api.get('/payments/installment/pending'),
}

// 打印API
export const printAPI = {
  getReceiptData: (orderId: number, params?: any) =>
    api.get(`/print/receipt/${orderId}`, { params }),
  
  generatePrintHTML: (data: any) =>
    api.post('/print/generate', data),
}

// 库存API
export const inventoryAPI = {
  getInventory: (params?: any) =>
    api.get('/inventory', { params }),
  
  transferInventory: (data: any) =>
    api.post('/inventory/transfer', data),
  
  adjustInventory: (data: any) =>
    api.post('/inventory/adjust', data),
  
  getInventoryTransactions: (params?: any) =>
    api.get('/inventory/transactions', { params }),
  
  getInventoryAlerts: () =>
    api.get('/inventory/alerts'),
}

// 报表API
export const reportsAPI = {
  getDashboardData: () =>
    api.get('/reports/dashboard'),
  
  getSalesTrend: (params?: any) =>
    api.get('/reports/sales-trend', { params }),
  
  getTopSellingItems: (params?: any) =>
    api.get('/reports/top-selling-items', { params }),
  
  getTopCustomers: (params?: any) =>
    api.get('/reports/top-customers', { params }),
  
  getInventoryTurnover: (params?: any) =>
    api.get('/reports/inventory-turnover', { params }),
  
  getInventoryReport: (params?: any) =>
    api.get('/reports/inventory-report', { params }),
  
  getProfitAnalysis: (params?: any) =>
    api.get('/reports/profit-analysis', { params }),
}

export default api 