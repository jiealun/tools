import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRightIcon, BoxIcon, BrandMark, SearchIcon } from '../components/SiteIcons'
import HomeBackdrop from '../components/HomeBackdrop'
import { fetchAPI } from '../lib/api'
import { getPublicDownloadCount } from '../lib/displayMetrics'

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
    <div className="site-page home-page">
      <div className="ambient-glow ambient-glow--top" aria-hidden="true" />
      <div className="ambient-glow ambient-glow--side" aria-hidden="true" />
      <div className="dot-field" aria-hidden="true" />
      <HomeBackdrop />

      <header className="site-header">
        <div className="site-header__inner">
          <div className="brand-lockup">
            <BrandMark className="brand-mark" />
            <div className="brand-copy">
              <span className="brand-name">RainbowTools</span>
              <span className="brand-subtitle">彩虹工具箱</span>
            </div>
          </div>

          <div className="site-header__actions">
            <span className="site-note">本站所有工具，一次购买，终身使用</span>
            <div className="search-field">
              <label htmlFor="tool-search" className="sr-only">搜索工具</label>
              <input
                id="tool-search"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索工具..."
              />
              <SearchIcon className="search-field__icon" />
            </div>
          </div>
        </div>
      </header>

      <main className="page-container home-main">
        <nav className="category-list" aria-label="工具分类">
          <button
            onClick={() => setActiveCategory('')}
            className={activeCategory === '' ? 'is-active' : ''}
            aria-pressed={activeCategory === ''}
          >
            全部
          </button>
          {Object.entries(categoryLabels).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveCategory(key)}
              className={activeCategory === key ? 'is-active' : ''}
              aria-pressed={activeCategory === key}
            >
              {label}
            </button>
          ))}
        </nav>

        {loading ? (
          <div className="empty-state">加载中...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="empty-state">
            <BoxIcon className="empty-state__icon" />
            <span>{searchQuery ? '没有找到匹配的工具' : '暂无工具'}</span>
          </div>
        ) : (
          <>
            <div className="product-grid">
              {visibleProducts.map((product) => (
                <Link key={product.id} to={`/product/${product.id}`} className="product-card">
                  <div className="product-card__visual">
                    {product.cover_url ? (
                      <img src={product.cover_url} alt={product.name} />
                    ) : (
                      <div className="product-card__placeholder">
                        <BoxIcon />
                      </div>
                    )}
                    <span className="product-card__arrow" aria-hidden="true">
                      <ArrowUpRightIcon />
                    </span>
                  </div>

                  <div className="product-card__body">
                    <div className="product-card__meta">
                      <span className="category-chip">
                        {categoryLabels[product.category] || product.category}
                      </span>
                      <span className="download-count">
                        {getPublicDownloadCount(product.download_count)}人已下载
                      </span>
                    </div>
                    <h2>{product.name}</h2>
                    <p>{product.description}</p>
                  </div>
                </Link>
              ))}
            </div>

            {hasMore && (
              <div ref={observerRef} className="load-more-status" aria-live="polite">
                {loadingMore ? '加载中...' : ''}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
