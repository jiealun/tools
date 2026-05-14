import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchAPI } from '../lib/api'

interface Product {
  id: string
  name: string
  description: string
  cover_url: string
  price: number
  category: string
  download_count: number
}

const categoryLabels: Record<string, string> = {
  plugin: '浏览器插件',
  figma: 'Figma插件',
  tutorial: '教程文档',
  tool: '实用工具',
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<string>('')

  useEffect(() => {
    loadProducts()
  }, [activeCategory])

  async function loadProducts() {
    setLoading(true)
    const query = activeCategory ? `?category=${activeCategory}` : ''
    const res = await fetchAPI(`/api/products${query}`)
    setProducts(res.data || [])
    setLoading(false)
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">🧰 工具箱</h1>
          <p className="text-gray-500 mt-1">精选实用工具与教程，助你提升效率</p>
        </div>
      </header>

      {/* 分类筛选 */}
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setActiveCategory('')}
            className={`px-4 py-2 rounded-full text-sm transition ${
              activeCategory === ''
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100 border'
            }`}
          >
            全部
          </button>
          {Object.entries(categoryLabels).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveCategory(key)}
              className={`px-4 py-2 rounded-full text-sm transition ${
                activeCategory === key
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 产品列表 */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-20 text-gray-400">加载中...</div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 text-gray-400">暂无工具</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <Link
                key={product.id}
                to={`/product/${product.id}`}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition group"
              >
                {/* 封面 */}
                <div className="aspect-video bg-gray-100 flex items-center justify-center overflow-hidden">
                  {product.cover_url ? (
                    <img
                      src={product.cover_url}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition"
                    />
                  ) : (
                    <span className="text-4xl">📦</span>
                  )}
                </div>
                {/* 信息 */}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                      {categoryLabels[product.category] || product.category}
                    </span>
                    <span className="text-xs text-gray-400">
                      {product.download_count} 次下载
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{product.name}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2">{product.description}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-lg font-bold text-orange-500">
                      ¥{product.price}
                    </span>
                    <span className="text-sm text-gray-400">查看详情 →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-12 py-6 text-center text-sm text-gray-400">
        © 2024 工具箱 · 精选实用工具与教程
      </footer>
    </div>
  )
}
