import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeftIcon,
  BookIcon,
  BoxIcon,
  BrandMark,
  ChartIcon,
  CheckIcon,
  DocumentIcon,
  DownloadIcon,
  ImageIcon,
  KeyIcon,
} from '../components/SiteIcons'
import { fetchAPI } from '../lib/api'
import { getPublicDownloadCount } from '../lib/displayMetrics'
import CustomerSupportWidget from '../components/CustomerSupportWidget'

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

  function cancelPayment() {
    setPayUrl('')
    setOrderNo('')
    if (pollRef.current) clearInterval(pollRef.current)
  }

  if (loading) {
    return <div className="site-page centered-state">加载中...</div>
  }

  if (!product) {
    return (
      <div className="site-page centered-state">
        <BoxIcon className="centered-state__icon" />
        <p>产品不存在</p>
        <Link to="/" className="text-link">返回首页</Link>
      </div>
    )
  }

  return (
    <div className="site-page detail-page">
      <div className="ambient-glow ambient-glow--top" aria-hidden="true" />
      <div className="ambient-glow ambient-glow--side" aria-hidden="true" />
      <div className="dot-field" aria-hidden="true" />

      <header className="site-header detail-header">
        <div className="site-header__inner">
          <Link to="/" className="brand-lockup" aria-label="RainbowTools 首页">
            <BrandMark className="brand-mark" />
            <div className="brand-copy">
              <span className="brand-name">RainbowTools</span>
              <span className="brand-subtitle">彩虹工具箱</span>
            </div>
          </Link>
          <Link to="/" className="back-link">
            <ArrowLeftIcon />
            <span>返回工具列表</span>
          </Link>
        </div>
      </header>

      <main className="page-container detail-main">
        <section className="detail-hero">
          <div className="detail-cover">
            {product.cover_url ? (
              <img src={product.cover_url} alt={product.name} />
            ) : (
              <div className="detail-cover__placeholder"><BoxIcon /></div>
            )}
          </div>

          <div className="detail-summary">
            <span className="category-chip">{categoryLabels[product.category] || product.category}</span>
            <h1>{product.name}</h1>
            <div className="price-row">
              <span className="price">¥{product.price}</span>
            </div>

            <div className="purchase-panel">
              {paid ? (
                <div className="purchase-flow">
                  <div className="payment-success">
                    <CheckIcon />
                    <p>支付成功！</p>
                  </div>
                  <button onClick={handleDownload} className="primary-button">
                    <DownloadIcon />
                    <span>立即下载</span>
                  </button>
                </div>
              ) : payUrl ? (
                <div className="purchase-flow">
                  <div className="qr-panel">
                    <p>请使用微信扫码支付</p>
                    <img src={payUrl} alt="支付二维码" />
                    <span>支付完成后会自动跳转</span>
                  </div>
                  <button onClick={cancelPayment} className="text-button">取消支付</button>
                </div>
              ) : (
                <button onClick={handlePay} disabled={paying} className="primary-button">
                  <KeyIcon />
                  <span>{paying ? '创建订单中...' : '立即购买'}</span>
                </button>
              )}
            </div>

            <div className="detail-stat">
              <ChartIcon />
              <p>已有 {getPublicDownloadCount(product.download_count)} 人下载</p>
            </div>
          </div>
        </section>

        <div className="detail-content-grid">
          <section className="content-section instruction-section">
            <div className="section-heading">
              <span className="section-heading__icon"><BookIcon /></span>
              <h2>使用说明</h2>
            </div>
            <div className="instruction-list">
              <p>1. 点击「立即购买」，扫码支付</p>
              <p>2. 支付成功后，页面自动显示下载按钮</p>
              <p>3. 点击「立即下载」获取文件</p>
              <p className="instruction-warning">请在支付成功后及时下载，不要关闭页面</p>
            </div>
          </section>

          {product.description && (
            <section className="content-section description-section">
              <div className="section-heading">
                <span className="section-heading__icon"><DocumentIcon /></span>
                <h2>详细介绍</h2>
              </div>
              <div className="rich-description">
                {renderTextWithLinks(product.description)}
              </div>
            </section>
          )}
        </div>

        {product.screenshots && product.screenshots.length > 0 && (
          <section className="content-section screenshots-section">
            <div className="section-heading">
              <span className="section-heading__icon"><ImageIcon /></span>
              <h2>预览截图</h2>
            </div>
            <div className="screenshot-grid">
              {product.screenshots.map((url, i) => (
                <img key={i} src={url} alt={`截图 ${i + 1}`} />
              ))}
            </div>
          </section>
        )}
      </main>

      <CustomerSupportWidget />
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
      return <img key={lineIdx} src={imgMatch[1]} alt="图片" className="rich-description__image" />
    }

    // 处理普通文本中的链接
    const urlRegex = /(https?:\/\/[^\s）)]+)/g
    const parts = line.split(urlRegex)

    return (
      <span key={lineIdx}>
        {parts.map((part, i) => {
          if (part.match(/^https?:\/\//)) {
            return (
              <a key={i} href={part} target="_blank" rel="noopener noreferrer">
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
