import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Col, Form, Input, InputNumber, Row, Space, Table, Tag, message } from 'antd'
import React, { useState } from 'react'

interface Unit {
  id?: number
  name: string
  conversion_rate: number
  is_base_unit: boolean
}

interface MultiUnitManagerProps {
  units: Unit[]
  onChange: (units: Unit[]) => void
  readonly?: boolean
}

const MultiUnitManager: React.FC<MultiUnitManagerProps> = ({ 
  units = [], 
  onChange, 
  readonly = false 
}) => {
  const [newUnit, setNewUnit] = useState<Partial<Unit>>({
    name: '',
    conversion_rate: 1,
    is_base_unit: false
  })

  // 添加单位
  const addUnit = () => {
    if (!newUnit.name) {
      message.error('请输入单位名称')
      return
    }

    if (!newUnit.conversion_rate || newUnit.conversion_rate <= 0) {
      message.error('请输入有效的换算比率')
      return
    }

    // 检查是否重复
    if (units.some(u => u.name === newUnit.name)) {
      message.error('单位名称已存在')
      return
    }

    const newUnitItem: Unit = {
      name: newUnit.name,
      conversion_rate: newUnit.conversion_rate || 1,
      is_base_unit: units.length === 0 || newUnit.is_base_unit || false
    }

    // 如果设为基本单位，其他单位取消基本单位状态
    let updatedUnits = [...units]
    if (newUnitItem.is_base_unit) {
      updatedUnits = updatedUnits.map(u => ({ ...u, is_base_unit: false }))
    }

    onChange([...updatedUnits, newUnitItem])
    setNewUnit({ name: '', conversion_rate: 1, is_base_unit: false })
    message.success('单位添加成功')
  }

  // 删除单位
  const removeUnit = (index: number) => {
    if (units[index].is_base_unit && units.length > 1) {
      message.error('不能删除基本单位，请先设置其他单位为基本单位')
      return
    }
    
    const newUnits = units.filter((_, i) => i !== index)
    onChange(newUnits)
    message.success('单位删除成功')
  }

  // 设置基本单位
  const setBaseUnit = (index: number) => {
    const newUnits = units.map((unit, i) => ({
      ...unit,
      is_base_unit: i === index
    }))
    onChange(newUnits)
    message.success('基本单位设置成功')
  }

  // 计算换算示例
  const getConversionExample = (unit: Unit, baseUnit?: Unit) => {
    if (!baseUnit) return ''
    
    if (unit.is_base_unit) {
      return `基本计量单位`
    }
    
    return `1${unit.name} = ${unit.conversion_rate}${baseUnit.name}`
  }

  const baseUnit = units.find(u => u.is_base_unit)

  const columns = [
    {
      title: '单位名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => (
        <span style={{ fontWeight: 500 }}>{name}</span>
      )
    },
    {
      title: '换算比率',
      dataIndex: 'conversion_rate',
      key: 'conversion_rate',
      render: (rate: number, record: Unit) => (
        <div>
          <span style={{ fontSize: '14px' }}>{rate}</span>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {getConversionExample(record, baseUnit)}
          </div>
        </div>
      )
    },
    {
      title: '状态',
      dataIndex: 'is_base_unit',
      key: 'is_base_unit',
      render: (isBaseUnit: boolean, record: Unit, index: number) => (
        <Space>
          {isBaseUnit ? (
            <Tag color="green">基本单位</Tag>
          ) : (
            !readonly && (
              <Button 
                size="small" 
                type="link"
                onClick={() => setBaseUnit(index)}
              >
                设为基本单位
              </Button>
            )
          )}
        </Space>
      )
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Unit, index: number) => (
        !readonly && (
          <Button
            size="small"
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => removeUnit(index)}
            disabled={record.is_base_unit && units.length > 1}
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
        {units.length > 0 ? (
          <div>
            <Table
              dataSource={units}
              columns={columns.filter(col => col.key !== 'action')}
              pagination={false}
              size="small"
              rowKey={(record, index) => `${record.name}-${index}`}
            />
            
            {/* 换算说明 */}
            <div style={{ 
              marginTop: 12, 
              padding: 12, 
              backgroundColor: '#f6ffed', 
              border: '1px solid #b7eb8f',
              borderRadius: 4 
            }}>
              <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: 4 }}>
                单位换算说明：
              </div>
              {units.map((unit, index) => (
                <div key={index} style={{ fontSize: '12px', color: '#666' }}>
                  • {getConversionExample(unit, baseUnit) || `${unit.name}（换算比率：${unit.conversion_rate}）`}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: '#999', padding: '20px 0' }}>
            使用默认单位
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      {/* 添加单位区域 */}
      <div style={{ 
        backgroundColor: '#fafafa', 
        padding: 16, 
        borderRadius: 6,
        marginBottom: 16 
      }}>
        <Row gutter={8} align="middle">
          <Col span={6}>
            <Input
              placeholder="单位名称"
              value={newUnit.name}
              onChange={(e) => setNewUnit({ ...newUnit, name: e.target.value })}
              onPressEnter={addUnit}
            />
          </Col>
          <Col span={6}>
            <InputNumber
              placeholder="换算比率"
              value={newUnit.conversion_rate}
              onChange={(value) => setNewUnit({ ...newUnit, conversion_rate: value || 1 })}
              min={0.001}
              step={0.1}
              precision={3}
              style={{ width: '100%' }}
            />
          </Col>
          <Col span={8}>
            <div style={{ fontSize: '12px', color: '#666', lineHeight: '32px' }}>
              {newUnit.name && newUnit.conversion_rate && baseUnit ? 
                `1${newUnit.name} = ${newUnit.conversion_rate}${baseUnit.name}` : 
                '例：1捆 = 10米'
              }
            </div>
          </Col>
          <Col span={4}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={addUnit}
              block
            >
              添加
            </Button>
          </Col>
        </Row>
        
        <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
          <div>• 第一个单位自动设为基本单位（库存计算基准）</div>
          <div>• 换算比率：1个新单位 = X个基本单位</div>
          <div>• 例如：基本单位"米"，添加"捆"，换算比率10，表示1捆=10米</div>
        </div>
      </div>

      {/* 单位列表 */}
      {units.length > 0 && (
        <div>
          <Table
            dataSource={units}
            columns={columns}
            pagination={false}
            size="small"
            rowKey={(record, index) => `${record.name}-${index}`}
          />
          
          {/* 库存计算说明 */}
          <div style={{ 
            marginTop: 12, 
            padding: 12, 
            backgroundColor: '#fff7e6', 
            border: '1px solid #ffd591',
            borderRadius: 4 
          }}>
            <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: 4 }}>
              库存计算说明：
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              • 所有库存以基本单位（{baseUnit?.name || '默认单位'}）为准进行计算
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              • 销售时可选择任意单位，系统自动换算扣减库存
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              • 例：库存100米，卖出2捆（20米），剩余80米
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MultiUnitManager
