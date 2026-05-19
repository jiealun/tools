import { Hono } from 'hono'
import { Env } from '../index'
import { getSupabase } from '../lib/supabase'

export const payRoute = new Hono<{ Bindings: Env }>()

// 创建支付订单
payRoute.post('/create', async (c) => {
  const { productId } = await c.req.json()
  const supabase = getSupabase(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_KEY)

  // 获取产品
  const { data: product, error } = await supabase
    .from('products')
    .select('id, name, price')
    .eq('id', productId)
    .eq('is_published', true)
    .single()

  if (error || !product) {
    return c.json({ error: '产品不存在' }, 404)
  }

  // 生成订单号
  const orderNo = 'ORD' + Date.now() + Math.random().toString(36).slice(2, 8)

  // 保存订单到数据库
  await supabase.from('orders').insert({
    order_no: orderNo,
    product_id: productId,
    amount: product.price,
    status: 'pending',
  })

  // 调用虎皮椒创建支付
  const params: Record<string, string> = {
    version: '1.1',
    appid: c.env.XUNHU_APPID,
    trade_order_id: orderNo,
    total_fee: String(product.price),
    title: product.name,
    notify_url: `https://api.rainbowtools.asia/api/pay/notify`,
    nonce_str: Math.random().toString(36).slice(2),
  }

  // 生成签名
  const sign = generateSign(params, c.env.XUNHU_SECRET)
  params.hash = sign

  // 请求虎皮椒
  const formBody = Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&')

  const res = await fetch(c.env.XUNHU_GATEWAY, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formBody,
  })

  const result: any = await res.json()

  if (result.errcode !== 0) {
    return c.json({ error: result.errmsg || '创建支付失败' }, 500)
  }

  return c.json({
    orderNo,
    payUrl: result.url_qrcode || result.url,
    codeUrl: result.url_qrcode,
  })
})

// 虎皮椒支付回调
payRoute.post('/notify', async (c) => {
  const body = await c.req.parseBody()
  const supabase = getSupabase(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_KEY)

  // 验证签名
  const hash = body.hash as string
  const params: Record<string, string> = {}
  for (const [k, v] of Object.entries(body)) {
    if (k !== 'hash' && typeof v === 'string') {
      params[k] = v
    }
  }

  const expectedSign = generateSign(params, c.env.XUNHU_SECRET)
  if (hash !== expectedSign) {
    return c.text('sign error')
  }

  const tradeOrderId = body.trade_order_id as string
  const status = body.status as string

  if (status === 'OD') {
    // 支付成功，更新订单状态
    await supabase
      .from('orders')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('order_no', tradeOrderId)
  }

  return c.text('success')
})

// 查询订单状态
payRoute.get('/status/:orderNo', async (c) => {
  const orderNo = c.req.param('orderNo')
  const supabase = getSupabase(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_KEY)

  const { data: order } = await supabase
    .from('orders')
    .select('status, product_id')
    .eq('order_no', orderNo)
    .single()

  if (!order) {
    return c.json({ error: '订单不存在' }, 404)
  }

  return c.json({ status: order.status, productId: order.product_id })
})

// 生成签名
function generateSign(params: Record<string, string>, secret: string): string {
  const sorted = Object.keys(params)
    .filter((k) => params[k] !== '' && k !== 'hash')
    .sort()
  const str = sorted.map((k) => `${k}=${params[k]}`).join('&') + secret
  return md5(str)
}

// MD5 实现
function md5(str: string): string {
  // 使用 Web Crypto 的替代方案：简单MD5实现
  let h0 = 0x67452301
  let h1 = 0xefcdab89
  let h2 = 0x98badcfe
  let h3 = 0x10325476

  const bytes: number[] = []
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i)
    if (code < 0x80) bytes.push(code)
    else if (code < 0x800) { bytes.push(0xc0 | (code >> 6)); bytes.push(0x80 | (code & 0x3f)) }
    else { bytes.push(0xe0 | (code >> 12)); bytes.push(0x80 | ((code >> 6) & 0x3f)); bytes.push(0x80 | (code & 0x3f)) }
  }

  const bitLen = bytes.length * 8
  bytes.push(0x80)
  while (bytes.length % 64 !== 56) bytes.push(0)
  bytes.push(bitLen & 0xff, (bitLen >> 8) & 0xff, (bitLen >> 16) & 0xff, (bitLen >> 24) & 0xff, 0, 0, 0, 0)

  const K = [
    0xd76aa478,0xe8c7b756,0x242070db,0xc1bdceee,0xf57c0faf,0x4787c62a,0xa8304613,0xfd469501,
    0x698098d8,0x8b44f7af,0xffff5bb1,0x895cd7be,0x6b901122,0xfd987193,0xa679438e,0x49b40821,
    0xf61e2562,0xc040b340,0x265e5a51,0xe9b6c7aa,0xd62f105d,0x02441453,0xd8a1e681,0xe7d3fbc8,
    0x21e1cde6,0xc33707d6,0xf4d50d87,0x455a14ed,0xa9e3e905,0xfcefa3f8,0x676f02d9,0x8d2a4c8a,
    0xfffa3942,0x8771f681,0x6d9d6122,0xfde5380c,0xa4beea44,0x4bdecfa9,0xf6bb4b60,0xbebfbc70,
    0x289b7ec6,0xeaa127fa,0xd4ef3085,0x04881d05,0xd9d4d039,0xe6db99e5,0x1fa27cf8,0xc4ac5665,
    0xf4292244,0x432aff97,0xab9423a7,0xfc93a039,0x655b59c3,0x8f0ccc92,0xffeff47d,0x85845dd1,
    0x6fa87e4f,0xfe2ce6e0,0xa3014314,0x4e0811a1,0xf7537e82,0xbd3af235,0x2ad7d2bb,0xeb86d391
  ]
  const S = [7,12,17,22,7,12,17,22,7,12,17,22,7,12,17,22,5,9,14,20,5,9,14,20,5,9,14,20,5,9,14,20,4,11,16,23,4,11,16,23,4,11,16,23,4,11,16,23,6,10,15,21,6,10,15,21,6,10,15,21,6,10,15,21]

  for (let i = 0; i < bytes.length; i += 64) {
    const M: number[] = []
    for (let j = 0; j < 16; j++) {
      M[j] = bytes[i + j * 4] | (bytes[i + j * 4 + 1] << 8) | (bytes[i + j * 4 + 2] << 16) | (bytes[i + j * 4 + 3] << 24)
    }

    let a = h0, b = h1, cc = h2, d = h3
    for (let j = 0; j < 64; j++) {
      let f: number, g: number
      if (j < 16) { f = (b & cc) | (~b & d); g = j }
      else if (j < 32) { f = (d & b) | (~d & cc); g = (5 * j + 1) % 16 }
      else if (j < 48) { f = b ^ cc ^ d; g = (3 * j + 5) % 16 }
      else { f = cc ^ (b | ~d); g = (7 * j) % 16 }

      const temp = d
      d = cc
      cc = b
      const x = (a + f + K[j] + M[g]) >>> 0
      b = (b + ((x << S[j]) | (x >>> (32 - S[j])))) >>> 0
      a = temp
    }

    h0 = (h0 + a) >>> 0
    h1 = (h1 + b) >>> 0
    h2 = (h2 + cc) >>> 0
    h3 = (h3 + d) >>> 0
  }

  const hex = (n: number) => {
    let s = ''
    for (let i = 0; i < 4; i++) s += ((n >> (i * 8)) & 0xff).toString(16).padStart(2, '0')
    return s
  }

  return hex(h0) + hex(h1) + hex(h2) + hex(h3)
}
