import { useEffect, useState, useRef } from 'react'
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
  const [paying, setPaying] = useState(false)
  const [payUrl, setPayUrl] = useState('')
  const [orderNo, setOrderNo] = useState('')
  const [paid, setPaid] = useState(false)
  const pollRef = useRef<number | null>(null)

  useEffect(() => {
    loadProduct()
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [id])

  async function loadProduct() {
    setLoading(true)
    const res = await fetchAPI(`/api/products/${id}`)
    setProduct(res.data || null)
    setLoading(false)
  }

  async function handlePay() {
    setPaying(true)
    try {
      const res = await fetchAPI('/api/pay/create', {
        method: 'POST',
        body: JSON.stringify({ productId: id }),
      })

      if (res.error) {
        alert(res.error)
        setPaying(false)
        return
      }

      setPayUrl(res.codeUrl || res.payUrl)
      setOrderNo(res.orderNo)

      // 开始轮询订单状态
      pollRef.current = window.setInterval(async () => {
        const statusRes = await fetchAPI(`/api/pay/status/${res.orderNo}`)
        if (statusRes.status === 'paid') {
          setPaid(true)
          setPayUrl('')
          if (pollRef.current) clearInterval(pollRef.current)
        }
      }, 3000)
    } catch (err: any) {
      alert('创建订单失败: ' + err.message)
    } finally {
      setPaying(false)
    }
  }

  function handleDownload() {
    if (orderNo) {
      window.location.href = `https://api.rainbowtools.asia/api/download/${orderNo}`
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
            <h1 className="text-2xl font-bold text-gray-900 mt-3 mb-4">{product.name}</h1>

            <div className="space-y-4">
              {/* 价格 */}
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold text-orange-500">¥{product.price}</span>
              </div>

              {/* 支付/下载区域 */}
              {paid ? (
                <div className="space-y-3">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <p className="text-green-700 font-medium">✅ 支付成功！</p>
                  </div>
                  <button
                    onClick={handleDownload}
                    className="block w-full text-center py-3 px-6 bg-[#6b38d4] text-white rounded-lg hover:bg-[#5a2db8] transition font-medium"
                  >
                    📥 立即下载
                  </button>
                </div>
              ) : payUrl ? (
                <div className="space-y-3">
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <p className="text-sm text-gray-500 mb-3">请使用支付宝扫码支付</p>
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(payUrl)}`}
                      alt="支付二维码"
                      className="mx-auto w-[200px] h-[200px] rounded-lg"
                    />
                    <p className="text-xs text-gray-400 mt-3">支付完成后会自动跳转</p>
                  </div>
                  <button
                    onClick={() => { setPayUrl(''); setOrderNo(''); if (pollRef.current) clearInterval(pollRef.current) }}
                    className="w-full py-2 text-sm text-gray-500 hover:text-gray-700"
                  >
                    取消支付
                  </button>
                </div>
              ) : (
                <button
                  onClick={handlePay}
                  disabled={paying}
                  className="block w-full text-center py-3 px-6 bg-[#6b38d4] text-white rounded-lg hover:bg-[#5a2db8] transition font-medium disabled:opacity-50"
                >
                  {paying ? '创建订单中...' : '🔑 立即购买'}
                </button>
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
            <p>1. 点击「立即购买」，扫码支付</p>
            <p>2. 支付成功后，页面自动显示下载按钮</p>
            <p>3. 点击「立即下载」获取文件</p>
            <p className="text-red-400">⚠️ 请在支付成功后及时下载，不要关闭页面</p>
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
