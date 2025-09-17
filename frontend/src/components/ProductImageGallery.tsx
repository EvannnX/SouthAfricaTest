import { CloseOutlined, DeleteOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Card, Image, Modal, Space, Upload, message } from 'antd'
import type { UploadFile, UploadProps } from 'antd'
import React, { useState } from 'react'

interface ProductImage {
  id?: number
  url: string
  type: 'main' | 'detail' | 'other'
  sort_order: number
}

interface ProductImageGalleryProps {
  images: ProductImage[]
  onChange: (images: ProductImage[]) => void
  readonly?: boolean
  maxCount?: number
}

const ProductImageGallery: React.FC<ProductImageGalleryProps> = ({ 
  images = [], 
  onChange, 
  readonly = false,
  maxCount = 10 
}) => {
  const [previewVisible, setPreviewVisible] = useState(false)
  const [previewImage, setPreviewImage] = useState('')
  const [previewTitle, setPreviewTitle] = useState('')
  const [fileList, setFileList] = useState<UploadFile[]>([])

  // 将images转换为UploadFile格式
  React.useEffect(() => {
    const uploadFiles: UploadFile[] = images.map((img, index) => ({
      uid: img.id ? `${img.id}` : `temp-${index}`,
      name: `image-${index + 1}.jpg`,
      status: 'done',
      url: img.url,
      thumbUrl: img.url
    }))
    setFileList(uploadFiles)
  }, [images])

  const handlePreview = async (file: UploadFile) => {
    setPreviewImage(file.url || file.thumbUrl || '')
    setPreviewVisible(true)
    setPreviewTitle(file.name || '商品图片')
  }

  const handleChange: UploadProps['onChange'] = ({ fileList: newFileList }) => {
    setFileList(newFileList)
    
    // 转换回ProductImage格式
    const newImages: ProductImage[] = newFileList
      .filter(file => file.status === 'done')
      .map((file, index) => ({
        id: file.uid.startsWith('temp-') ? undefined : parseInt(file.uid),
        url: file.url || file.response?.url || '',
        type: index === 0 ? 'main' : 'detail',
        sort_order: index
      }))
    
    onChange(newImages)
  }

  const handleRemove = (file: UploadFile) => {
    const newImages = images.filter((img, index) => {
      const fileUid = img.id ? `${img.id}` : `temp-${index}`
      return fileUid !== file.uid
    })
    onChange(newImages)
    return true
  }

  const customUpload = async (options: any) => {
    const { file, onSuccess, onError } = options
    
    // 这里应该上传到服务器，现在模拟本地预览
    try {
      const reader = new FileReader()
      reader.onload = (e) => {
        const url = e.target?.result as string
        onSuccess({
          url: url,
          name: file.name
        })
      }
      reader.readAsDataURL(file)
    } catch (error) {
      onError(error)
      message.error('图片上传失败')
    }
  }

  const uploadButton = (
    <div>
      <PlusOutlined />
      <div style={{ marginTop: 8 }}>上传图片</div>
    </div>
  )

  if (readonly) {
    return (
      <div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {images.map((image, index) => (
            <div key={index} style={{ position: 'relative' }}>
              <Image
                width={80}
                height={80}
                src={image.url}
                style={{ 
                  objectFit: 'cover',
                  borderRadius: 4,
                  border: '1px solid #d9d9d9'
                }}
                preview={{
                  mask: <div><EyeOutlined /> 查看</div>
                }}
              />
              {image.type === 'main' && (
                <div style={{
                  position: 'absolute',
                  top: 2,
                  left: 2,
                  backgroundColor: '#1890ff',
                  color: 'white',
                  fontSize: 10,
                  padding: '1px 4px',
                  borderRadius: 2
                }}>
                  主图
                </div>
              )}
            </div>
          ))}
        </div>
        {images.length === 0 && (
          <div style={{ 
            textAlign: 'center', 
            color: '#999', 
            padding: '20px 0' 
          }}>
            暂无图片
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      <Upload
        customRequest={customUpload}
        listType="picture-card"
        fileList={fileList}
        onPreview={handlePreview}
        onChange={handleChange}
        onRemove={handleRemove}
        accept="image/*"
        multiple
      >
        {fileList.length >= maxCount ? null : uploadButton}
      </Upload>
      
      <Modal
        open={previewVisible}
        title={previewTitle}
        footer={null}
        onCancel={() => setPreviewVisible(false)}
        width="80%"
        style={{ top: 20 }}
      >
        <img 
          alt="预览" 
          style={{ width: '100%', maxHeight: '70vh', objectFit: 'contain' }} 
          src={previewImage} 
        />
      </Modal>

      {images.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <Space wrap>
            {images.map((image, index) => (
              <Card
                key={index}
                size="small"
                style={{ width: 120 }}
                cover={
                  <img
                    alt={`图片${index + 1}`}
                    src={image.url}
                    style={{ 
                      height: 80, 
                      objectFit: 'cover',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      setPreviewImage(image.url)
                      setPreviewTitle(`商品图片 ${index + 1}`)
                      setPreviewVisible(true)
                    }}
                  />
                }
                actions={[
                  <Button
                    key="view"
                    type="link"
                    size="small"
                    icon={<EyeOutlined />}
                    onClick={() => {
                      setPreviewImage(image.url)
                      setPreviewTitle(`商品图片 ${index + 1}`)
                      setPreviewVisible(true)
                    }}
                  />,
                  <Button
                    key="delete"
                    type="link"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => {
                      const newImages = images.filter((_, i) => i !== index)
                      onChange(newImages)
                    }}
                  />
                ]}
              >
                <Card.Meta
                  title={
                    <div style={{ fontSize: 12 }}>
                      {image.type === 'main' ? '主图' : '详情图'}
                    </div>
                  }
                />
              </Card>
            ))}
          </Space>
        </div>
      )}

      <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
        • 支持jpg、png、gif格式
        • 建议图片尺寸：800x800像素
        • 第一张图片将作为主图显示
        • 最多可上传{maxCount}张图片
      </div>
    </div>
  )
}

export default ProductImageGallery
