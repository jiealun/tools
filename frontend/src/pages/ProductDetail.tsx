import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { fetchAPI } from '../lib/api'

interface Product {
  id: string
  name: string
  description: string
  cover_url: string
  screenshots: string[]
  price: number
  category: string
  download_url: string
  ifaka_url: string
  download_count: number
  created_at: string
}

const categoryLabels: Record<string, string> = {
  plugin: '浏览器插件',
  figma: 'Figma插件',
  tutorial: '教程文档',
  tool: '实用工具',
}

export default function ProductDetail() {
  const { id } = useParams()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProduct()
  }, [id])

  async function loadProduct() {
    setLoading(true)
    const res = await fetchAPI(`/api/products/${id}`)
    setProduct(res.data || null)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        加载中...
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-gray-400 mb-4">产品不存在</p>
        <Link to="/" className="text-blue-500 hover:underline">返回首页</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link to="/" className="text-gray-500 hover:text-gray-900 text-sm">
            ← 返回工具列表
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* 产品头部 */}
        <div className="flex flex-col md:flex-row gap-8 mb-8">
          {/* 封面 */}
          <div className="md:w-1/2">
            <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden">
              {product.cover_url ? (
                <img
                  src={product.cover_url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-6xl">
                  📦
                </div>
              )}
            </div>
          </div>

          {/* 信息 */}
          <div className="md:w-1/2">
            <span className="text-sm px-3 py-1 bg-gray-100 text-gray-600 rounded-full">
              {categoryLabels[product.category] || product.category}
            </span>
            <h1 className="text-2xl font-bold text-gray-900 mt-3 mb-2">{product.name}</h1>
            <p className="text-gray-500 mb-4">{product.description}</p>

            <div className="mb-6">
              <span className="text-3xl font-bold text-orange-500">¥{product.price}</span>
              <span className="text-sm text-gray-400 ml-2">/ 激活码</span>
            </div>

            <div className="space-y-3">
              {/* 下载按钮 */}
              {product.download_url && (
                <a
                  href={`/api/download/${product.id}`}
                  className="block w-full text-center py-3 px-6 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition font-medium"
                >
                  📥 免费下载（加密ZIP）
                </a>
              )}

              {/* 购买激活码 */}
              {product.ifaka_url && (
                <a
                  href={product.ifaka_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center py-3 px-6 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-medium"
                >
                  🔑 购买激活码（解压密码）
                </a>
              )}
            </div>

            <div className="mt-4 text-sm text-gray-400">
              <p>📊 已有 {product.download_count} 人下载</p>
              <p className="mt-1">💡 下载后需要激活码（解压密码）才能使用</p>
            </div>
          </div>
        </div>

        {/* 使用说明 */}
        <div className="border-t border-gray-200 pt-8">
          <h2 className="text-lg font-semibold mb-4">📖 使用说明</h2>
          <div className="bg-gray-50 rounded-lg p-6 space-y-3 text-sm text-gray-600">
            <p>1. 点击「免费下载」获取加密ZIP文件</p>
            <p>2. 点击「购买激活码」前往支付页面</p>
            <p>3. 支付成功后自动获得激活码（即解压密码）</p>
            <p>4. 使用激活码解压ZIP文件，即可获得完整内容</p>
          </div>
        </div>

        {/* 截图展示 */}
        {product.screenshots && product.screenshots.length > 0 && (
          <div className="border-t border-gray-200 pt-8 mt-8">
            <h2 className="text-lg font-semibold mb-4">🖼️ 预览截图</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {product.screenshots.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt={`截图 ${i + 1}`}
                  className="rounded-lg border border-gray-200"
                />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
