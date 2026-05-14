import { useEffect, useState, useRef, useCallback } from 'react'
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

const PAGE_SIZE = 15 // 一行3个 x 5行

export default function Home() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [loadingMore, setLoadingMore] = useState(false)
  const observerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadProducts()
  }, [activeCategory])

  async function loadProducts() {
    setLoading(true)
    setVisibleCount(PAGE_SIZE)
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

  const visibleProducts = filteredProducts.slice(0, visibleCount)
  const hasMore = visibleCount < filteredProducts.length

  // 滚动加载
  const loadMore = useCallback(() => {
    if (!hasMore || loadingMore) return
    setLoadingMore(true)
    setTimeout(() => {
      setVisibleCount((prev) => prev + PAGE_SIZE)
      setLoadingMore(false)
    }, 300)
  }, [hasMore, loadingMore])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore()
        }
      },
      { threshold: 0.1 }
    )
    if (observerRef.current) {
      observer.observe(observerRef.current)
    }
    return () => observer.disconnect()
  }, [loadMore])

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
          <span className="text-base text-[#6b38d4] font-medium ml-1">彩虹工具箱</span>
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

      {/* 分类筛选 */}
      <div className="max-w-[1200px] mx-auto px-6 mb-6">
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
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {visibleProducts.map((product) => (
                <Link
                  key={product.id}
                  to={`/product/${product.id}`}
                  className="group backdrop-blur-[8px] bg-white/40 border border-white/20 rounded-[24px] overflow-hidden shadow-[0px_8px_32px_0px_rgba(31,38,135,0.07)] hover:shadow-[0px_12px_40px_0px_rgba(31,38,135,0.12)] hover:border-[rgba(154,119,226,0.44)] transition-all duration-300"
                >
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
                  <div className="px-6 py-5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1.5 bg-[#dfd9ec] text-[#525d6b] text-sm rounded-full">
                        {categoryLabels[product.category] || product.category}
                      </span>
                      <span className="text-xs text-[#7c7984]">
                        {product.download_count}人已下载
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-[#1a1b21] pt-3">
                      {product.name}
                    </h3>
                    <p className="text-sm text-[#9a95a8] line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
            {/* 滚动加载触发器 */}
            {hasMore && (
              <div ref={observerRef} className="text-center py-8 text-gray-400 text-sm">
                {loadingMore ? '加载中...' : ''}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
