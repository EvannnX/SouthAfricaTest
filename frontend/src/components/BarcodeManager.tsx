import { DeleteOutlined, PlusOutlined, ScanOutlined } from '@ant-design/icons'
import { Button, Col, Form, Input, Row, Select, Space, Table, Tag, message } from 'antd'
import React, { useState } from 'react'

interface Barcode {
  id?: number
  code: string
  type: 'ean13' | 'ean8' | 'code128' | 'custom'
  is_primary: boolean
}

interface BarcodeManagerProps {
  barcodes: Barcode[]
  onChange: (barcodes: Barcode[]) => void
  readonly?: boolean
}

const BarcodeManager: React.FC<BarcodeManagerProps> = ({ 
  barcodes = [], 
  onChange, 
  readonly = false 
}) => {
  const [newBarcode, setNewBarcode] = useState<Partial<Barcode>>({
    type: 'custom',
    is_primary: false
  })

  // 条码类型选项
  const barcodeTypes = [
    { value: 'ean13', label: 'EAN-13 (13位)' },
    { value: 'ean8', label: 'EAN-8 (8位)' },
    { value: 'code128', label: 'Code 128' },
    { value: 'custom', label: '自定义' }
  ]

  // 验证条码格式
  const validateBarcode = (code: string, type: string): boolean => {
    if (!code) return false
    
    switch (type) {
      case 'ean13':
        return /^\d{13}$/.test(code)
      case 'ean8':
        return /^\d{8}$/.test(code)
      case 'code128':
        return /^[A-Za-z0-9\-\.\s]+$/.test(code) && code.length <= 50
      case 'custom':
        return /^[A-Za-z0-9\-\.\s\!\@\#\$\%\^\&\*\(\)\_\+\=\[\]\{\}\|\\\:\;\"\'\<\>\,\.\?\/\~\`]+$/.test(code) && code.length <= 100
      default:
        return true
    }
  }

  // 添加条码
  const addBarcode = () => {
    if (!newBarcode.code) {
      message.error('请输入条码')
      return
    }

    if (!validateBarcode(newBarcode.code, newBarcode.type || 'custom')) {
      message.error('条码格式不正确')
      return
    }

    // 检查是否重复
    if (barcodes.some(b => b.code === newBarcode.code)) {
      message.error('条码已存在')
      return
    }

    const newBarcodeItem: Barcode = {
      code: newBarcode.code,
      type: newBarcode.type as any || 'custom',
      is_primary: barcodes.length === 0 || newBarcode.is_primary || false
    }

    // 如果设为主条码，其他条码取消主条码状态
    let updatedBarcodes = [...barcodes]
    if (newBarcodeItem.is_primary) {
      updatedBarcodes = updatedBarcodes.map(b => ({ ...b, is_primary: false }))
    }

    onChange([...updatedBarcodes, newBarcodeItem])
    setNewBarcode({ type: 'custom', is_primary: false })
    message.success('条码添加成功')
  }

  // 删除条码
  const removeBarcode = (index: number) => {
    const newBarcodes = barcodes.filter((_, i) => i !== index)
    onChange(newBarcodes)
    message.success('条码删除成功')
  }

  // 设置主条码
  const setPrimary = (index: number) => {
    const newBarcodes = barcodes.map((barcode, i) => ({
      ...barcode,
      is_primary: i === index
    }))
    onChange(newBarcodes)
    message.success('主条码设置成功')
  }

  // 扫描条码（模拟功能）
  const scanBarcode = () => {
    // 这里应该接入扫描枪硬件
    message.info('请使用扫描枪扫描条码，或手动输入')
  }

  // 获取条码类型显示文本
  const getBarcodeTypeText = (type: string) => {
    const typeMap: Record<string, string> = {
      ean13: 'EAN-13',
      ean8: 'EAN-8',
      code128: 'Code128',
      custom: '自定义'
    }
    return typeMap[type] || type
  }

  // 获取条码类型颜色
  const getBarcodeTypeColor = (type: string) => {
    const colorMap: Record<string, string> = {
      ean13: 'blue',
      ean8: 'green',
      code128: 'orange',
      custom: 'purple'
    }
    return colorMap[type] || 'default'
  }

  const columns = [
    {
      title: '条码',
      dataIndex: 'code',
      key: 'code',
      render: (code: string) => (
        <span style={{ fontFamily: 'monospace', fontSize: '14px' }}>{code}</span>
      )
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={getBarcodeTypeColor(type)}>
          {getBarcodeTypeText(type)}
        </Tag>
      )
    },
    {
      title: '状态',
      dataIndex: 'is_primary',
      key: 'is_primary',
      render: (isPrimary: boolean, record: Barcode, index: number) => (
        <Space>
          {isPrimary ? (
            <Tag color="gold">主条码</Tag>
          ) : (
            !readonly && (
              <Button 
                size="small" 
                type="link"
                onClick={() => setPrimary(index)}
              >
                设为主条码
              </Button>
            )
          )}
        </Space>
      )
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Barcode, index: number) => (
        !readonly && (
          <Button
            size="small"
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => removeBarcode(index)}
          >
            删除
          </Button>
        )
      )
    }
  ]

  if (readonly) {
    return (
      <div>
        {barcodes.length > 0 ? (
          <Table
            dataSource={barcodes}
            columns={columns.filter(col => col.key !== 'action')}
            pagination={false}
            size="small"
            rowKey={(record, index) => `${record.code}-${index}`}
          />
        ) : (
          <div style={{ textAlign: 'center', color: '#999', padding: '20px 0' }}>
            暂无条码信息
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      {/* 添加条码区域 */}
      <div style={{ 
        backgroundColor: '#fafafa', 
        padding: 16, 
        borderRadius: 6,
        marginBottom: 16 
      }}>
        <Row gutter={8} align="middle">
          <Col span={8}>
            <Input
              placeholder="请输入条码"
              value={newBarcode.code}
              onChange={(e) => setNewBarcode({ ...newBarcode, code: e.target.value })}
              onPressEnter={addBarcode}
              suffix={
                <Button
                  type="text"
                  size="small"
                  icon={<ScanOutlined />}
                  onClick={scanBarcode}
                  title="扫描条码"
                />
              }
            />
          </Col>
          <Col span={6}>
            <Select
              value={newBarcode.type}
              onChange={(type) => setNewBarcode({ ...newBarcode, type })}
              style={{ width: '100%' }}
            >
              {barcodeTypes.map(type => (
                <Select.Option key={type.value} value={type.value}>
                  {type.label}
                </Select.Option>
              ))}
            </Select>
          </Col>
          <Col span={6}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={addBarcode}
              block
            >
              添加条码
            </Button>
          </Col>
        </Row>
        
        <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
          <div>• 支持EAN-13、EAN-8、Code128等标准格式</div>
          <div>• 支持英文、数字、空格、特殊符号</div>
          <div>• 可录入厂家原条码或自定义条码</div>
          <div>• 第一个条码自动设为主条码</div>
        </div>
      </div>

      {/* 条码列表 */}
      {barcodes.length > 0 && (
        <Table
          dataSource={barcodes}
          columns={columns}
          pagination={false}
          size="small"
          rowKey={(record, index) => `${record.code}-${index}`}
        />
      )}
    </div>
  )
}

export default BarcodeManager
