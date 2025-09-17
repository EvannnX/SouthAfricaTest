import {
    BarChartOutlined,
    CreditCardOutlined,
    DashboardOutlined,
    DollarOutlined,
    HomeOutlined,
    LogoutOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    ShoppingCartOutlined,
    ShoppingOutlined,
    TeamOutlined,
    UserOutlined
} from '@ant-design/icons'
import { Layout as AntLayout, Avatar, Button, Dropdown, Menu } from 'antd'
import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation, useNavigate } from 'react-router-dom'
import { RootState } from '../store'
import { logout } from '../store/authSlice'

const { Header, Sider, Content } = AntLayout

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch()
  const { user } = useSelector((state: RootState) => state.auth)

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '仪表板',
    },
    {
      key: '/items',
      icon: <ShoppingOutlined />,
      label: '货品管理',
    },
    {
      key: '/suppliers',
      icon: <TeamOutlined />,
      label: '供应商管理',
    },
    {
      key: '/customers',
      icon: <UserOutlined />,
      label: '客户管理',
    },
    {
      key: '/inventory',
      icon: <HomeOutlined />,
      label: '库存管理',
    },
    {
      key: '/purchases',
      icon: <ShoppingCartOutlined />,
      label: '采购管理',
    },
    {
      key: '/sales',
      icon: <DollarOutlined />,
      label: '销售管理',
    },
    {
      key: '/pos',
      icon: <CreditCardOutlined />,
      label: 'POS开单',
    },
    {
      key: '/reports',
      icon: <BarChartOutlined />,
      label: '报表分析',
    },
  ]

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key)
  }

  const handleLogout = () => {
    dispatch(logout())
  }

  const userMenuItems = [
    {
      key: 'profile',
      label: '个人信息',
      icon: <UserOutlined />,
    },
    {
      key: 'logout',
      label: '退出登录',
      icon: <LogoutOutlined />,
      onClick: handleLogout,
    },
  ]

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed}>
        <div style={{ 
          height: '64px', 
          margin: '16px', 
          background: 'rgba(255, 255, 255, 0.3)',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '18px',
          fontWeight: 'bold'
        }}>
          {collapsed ? 'WMS' : '仓储管理系统'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <AntLayout>
        <Header style={{ 
          padding: '0 16px', 
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: '16px',
              width: 64,
              height: 64,
            }}
          />
          
          <Dropdown
            menu={{ items: userMenuItems }}
            placement="bottomRight"
          >
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              cursor: 'pointer',
              padding: '0 8px'
            }}>
              <Avatar icon={<UserOutlined />} style={{ marginRight: 8 }} />
              <span>{user?.username}</span>
            </div>
          </Dropdown>
        </Header>
        <Content>{children}</Content>
      </AntLayout>
    </AntLayout>
  )
}

export default Layout 