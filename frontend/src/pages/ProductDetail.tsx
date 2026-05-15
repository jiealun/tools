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
  buy_url: string
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
  const [code, setCode] = useState('')
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState('')
  const [showCodeInput, setShowCodeInput] = useState(false)

  useEffect(() => {
    loadProduct()
  }, [id])

  async function loadProduct() {
    setLoading(true)
    const res = await fetchAPI(`/api/products/${id}`)
    setProduct(res.data || null)
    setLoading(false)
  }

  async function handleDownload() {
    if (!code.trim()) {
      setError('请输入激活码')
      return
    }

    setDownloading(true)
    setError('')

    try {
      const API_BASE = import.meta.env.VITE_API_URL || ''
      const res = await fetch(`${API_BASE}/api/download/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || '下载失败')
        setDownloading(false)
        return
      }

      // 下载文件
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${product?.name || 'download'}.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setCode('')
      setShowCodeInput(false)
      setError('')
    } catch (err: any) {
      setError('网络错误，请重试')
    } finally {
      setDownloading(false)
    }
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

            <div className="mb-6">
              <span className="text-3xl font-bold text-orange-500">¥{product.price}</span>
              <a
                href={product.buy_url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-3 inline-block px-4 py-1.5 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600 transition"
              >
                获取激活码
              </a>
            </div>

            <div className="space-y-3">
              {/* 输入激活码下载 */}
              {!showCodeInput ? (
                <button
                  onClick={() => setShowCodeInput(true)}
                  className="block w-full text-center py-3 px-6 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition font-medium"
                >
                  📥 输入激活码下载
                </button>
              ) : (
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => { setCode(e.target.value); setError('') }}
                    placeholder="请输入激活码"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-gray-900 text-center font-mono tracking-wider"
                    onKeyDown={(e) => e.key === 'Enter' && handleDownload()}
                    autoFocus
                  />
                  {error && (
                    <p className="text-red-500 text-sm text-center">{error}</p>
                  )}
                  <button
                    onClick={handleDownload}
                    disabled={downloading}
                    className="w-full py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition disabled:opacity-50"
                  >
                    {downloading ? '验证中...' : '确认下载'}
                  </button>
                  <button
                    onClick={() => { setShowCodeInput(false); setError('') }}
                    className="w-full py-2 text-sm text-gray-500 hover:text-gray-700"
                  >
                    取消
                  </button>
                </div>
              )}

            </div>

            <div className="mt-4 text-sm text-gray-400">
              <p>📊 已有 {product.download_count} 人下载</p>
            </div>
          </div>
        </div>

        {/* 使用说明 */}
        <div className="border-t border-gray-200 pt-8">
          <h2 className="text-lg font-semibold mb-4">📖 使用说明</h2>
          <div className="bg-gray-50 rounded-lg p-6 space-y-3 text-sm text-gray-600">
            <p>1. 点击「获取激活码」前往购买页面下单</p>
            <p>2. 下单后联系卖家获取激活码</p>
            <p>3. 回到本页面，点击「输入激活码下载」</p>
            <p>4. 输入激活码，验证通过后自动下载文件</p>
            <p className="text-red-400">⚠️ 每个激活码仅可使用一次，请妥善保管下载的文件</p>
          </div>
        </div>

        {/* 产品详细介绍 */}
        {product.description && (
          <div className="border-t border-gray-200 pt-8 mt-8">
            <h2 className="text-lg font-semibold mb-4">📝 详细介绍</h2>
            <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
              {renderTextWithLinks(product.description)}
            </div>
          </div>
        )}

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

// 将文本中的 URL 自动转为可点击链接，Markdown图片语法渲染为图片
function renderTextWithLinks(text: string) {
  const lines = text.split('\n')

  return lines.map((line, lineIdx) => {
    // 检查是否是 Markdown 图片语法 ![alt](url)
    const imgMatch = line.match(/^!\[.*?\]\((.+?)\)$/)
    if (imgMatch) {
      return (
        <img
          key={lineIdx}
          src={imgMatch[1]}
          alt="图片"
          className="rounded-lg max-w-full my-2"
        />
      )
    }

    // 处理普通文本中的链接
    const urlRegex = /(https?:\/\/[^\s）)]+)/g
    const parts = line.split(urlRegex)

    return (
      <span key={lineIdx}>
        {parts.map((part, i) => {
          if (part.match(/^https?:\/\//)) {
            return (
              <a
                key={i}
                href={part}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline break-all"
              >
                {part}
              </a>
            )
          }
          return <span key={i}>{part}</span>
        })}
        {lineIdx < lines.length - 1 && <br />}
      </span>
    )
  })
}
