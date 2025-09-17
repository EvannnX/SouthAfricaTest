import { useSelector } from 'react-redux'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Customers from './pages/Customers'
import Dashboard from './pages/Dashboard'
import Inventory from './pages/Inventory'
import Items from './pages/Items'
import Login from './pages/Login'
import POS from './pages/POS'
import Purchases from './pages/Purchases'
import Reports from './pages/Reports'
import Sales from './pages/Sales'
import Suppliers from './pages/Suppliers'
import { RootState } from './store'

function App() {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth)

  if (!isAuthenticated) {
    return <Login />
  }

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/pos" element={<POS />} />
          <Route path="/items" element={<Items />} />
          <Route path="/suppliers" element={<Suppliers />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/purchases" element={<Purchases />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/reports" element={<Reports />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export default App
