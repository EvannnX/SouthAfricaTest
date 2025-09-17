import { LockOutlined, UserOutlined } from '@ant-design/icons'
import { Button, Form, Input, message } from 'antd'
import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import { authAPI } from '../services/api'
import { loginSuccess } from '../store/authSlice'

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const dispatch = useDispatch()

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true)
    try {
      const response = await authAPI.login(values)
      const { token, user } = response.data
      
      dispatch(loginSuccess({ token, user }))
      message.success('登录成功')
    } catch (error: any) {
      message.error(error.response?.data?.error || '登录失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-form">
        <h1 className="login-title">仓储管理系统</h1>
        <Form
          name="login"
          onFinish={onFinish}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名!' }]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="用户名" 
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码!' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
            />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              style={{ width: '100%' }}
            >
              登录
            </Button>
          </Form.Item>
        </Form>
        
        <div style={{ 
          textAlign: 'center', 
          marginTop: '20px', 
          color: '#666',
          fontSize: '14px'
        }}>
          默认账户: admin / 123456
        </div>
      </div>
    </div>
  )
}

export default Login
