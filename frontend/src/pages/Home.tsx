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
  tutorial: '教程',
  tool: '实用工具',
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
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

  const filteredProducts = searchQuery
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : products

  return (
    <div className="min-h-screen" style={{
      background: 'linear-gradient(140deg, #f4f3fb 0%, #e9ddff 100%)'
    }}>
      {/* 顶部导航 */}
      <header className="max-w-[1200px] mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-3xl">🦄</span>
          <span className="text-2xl font-extrabold bg-gradient-to-r from-[#6b38d4] to-[#b10e6b] bg-clip-text text-transparent">
            RainbowTools
          </span>
        </div>
        {/* 搜索框 */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索工具..."
            className="w-[256px] h-[40px] pl-6 pr-10 rounded-full bg-[#f4f3fb] backdrop-blur-sm text-sm text-gray-700 placeholder-gray-400 outline-none focus:ring-2 focus:ring-purple-300 transition"
          />
          <svg
            className="absolute right-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </header>

      {/* Hero Banner */}
      <div className="max-w-[1200px] mx-auto px-6 mb-10">
        <div className="relative h-[184px] rounded-[32px] overflow-hidden flex items-center justify-center">
          {/* 背景 */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-400/30 via-purple-600/20 to-pink-400/20" />
          <div className="absolute inset-0" style={{
            background: 'radial-gradient(ellipse at 20% 50%, rgba(132,85,239,0.3) 0%, transparent 50%), radial-gradient(ellipse at 80% 50%, rgba(96,99,238,0.2) 0%, transparent 50%)'
          }} />
          {/* 毛玻璃文字容器 */}
          <div className="relative backdrop-blur-[12px] bg-white/40 border border-white/40 rounded-[40px] px-16 py-12 shadow-2xl">
            <h1 className="text-5xl font-medium text-[#1a1b21] tracking-tight">
              新工具上新啦
            </h1>
          </div>
        </div>
      </div>

      {/* 分类筛选 + 标题 */}
      <div className="max-w-[1200px] mx-auto px-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[32px] font-medium text-[#1a1b21] tracking-tight">最新工具发现</h2>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setActiveCategory('')}
            className={`px-4 py-2 rounded-full text-sm transition backdrop-blur-sm ${
              activeCategory === ''
                ? 'bg-[#6b38d4] text-white shadow-lg shadow-purple-300/30'
                : 'bg-white/40 text-[#525d6b] hover:bg-white/60 border border-white/20'
            }`}
          >
            全部
          </button>
          {Object.entries(categoryLabels).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveCategory(key)}
              className={`px-4 py-2 rounded-full text-sm transition backdrop-blur-sm ${
                activeCategory === key
                  ? 'bg-[#6b38d4] text-white shadow-lg shadow-purple-300/30'
                  : 'bg-white/40 text-[#525d6b] hover:bg-white/60 border border-white/20'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 产品列表 */}
      <main className="max-w-[1200px] mx-auto px-6 pb-20">
        {loading ? (
          <div className="text-center py-20 text-gray-400">加载中...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            {searchQuery ? '没有找到匹配的工具' : '暂无工具'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProducts.map((product) => (
              <Link
                key={product.id}
                to={`/product/${product.id}`}
                className="group backdrop-blur-[8px] bg-white/40 border border-white/20 rounded-[24px] overflow-hidden shadow-[0px_8px_32px_0px_rgba(31,38,135,0.07)] hover:shadow-[0px_12px_40px_0px_rgba(31,38,135,0.12)] hover:border-[rgba(154,119,226,0.44)] transition-all duration-300"
              >
                {/* 封面图 */}
                <div className="h-[230px] rounded-[24px] overflow-hidden shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
                  {product.cover_url ? (
                    <img
                      src={product.cover_url}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center">
                      <span className="text-5xl">📦</span>
                    </div>
                  )}
                </div>

                {/* 信息 */}
                <div className="px-6 py-5 space-y-2">
                  {/* 分类 + 下载量 */}
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1.5 bg-[#dfd9ec] text-[#525d6b] text-sm rounded-full">
                      {categoryLabels[product.category] || product.category}
                    </span>
                    <span className="text-xs text-[#7c7984]">
                      {product.download_count}人已下载
                    </span>
                  </div>

                  {/* 名称 */}
                  <h3 className="text-2xl font-semibold text-[#1a1b21] pt-3">
                    {product.name}
                  </h3>

                  {/* 简介 */}
                  <p className="text-base text-[#494454] line-clamp-2 leading-relaxed">
                    {product.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
