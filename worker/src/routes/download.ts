import { Hono } from 'hono'
import { Env } from '../index'
import { getSupabase } from '../lib/supabase'

export const downloadRoute = new Hono<{ Bindings: Env }>()

// 付款成功后用订单号下载
downloadRoute.get('/:orderNo', async (c) => {
  const orderNo = c.req.param('orderNo')
  const supabase = getSupabase(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_KEY)

  // 验证订单
  const { data: order } = await supabase
    .from('orders')
    .select('status, product_id')
    .eq('order_no', orderNo)
    .eq('status', 'paid')
    .single()

  if (!order) {
    return c.json({ error: '订单未支付或不存在' }, 403)
  }

  // 获取产品
  const { data: product } = await supabase
    .from('products')
    .select('id, name, download_url, download_count')
    .eq('id', order.product_id)
    .single()

  if (!product || !product.download_url) {
    return c.json({ error: '文件不存在' }, 404)
  }

  // 更新下载计数
  await supabase
    .from('products')
    .update({ download_count: (product.download_count || 0) + 1 })
    .eq('id', product.id)

  // 从 Supabase Storage 下载文件
  const { data: fileData, error: downloadError } = await supabase.storage
    .from('toolbox')
    .download(product.download_url)

  if (downloadError || !fileData) {
    return c.json({ error: '文件不存在' }, 404)
  }

  // 获取原始文件扩展名
  const ext = product.download_url.split('.').pop() || 'zip'
  const fileName = `${product.name}.${ext}`

  // 根据扩展名设置 Content-Type
  const mimeTypes: Record<string, string> = {
    zip: 'application/zip',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    mp4: 'video/mp4',
    crx: 'application/x-chrome-extension',
  }
  const contentType = mimeTypes[ext] || 'application/octet-stream'

  const headers = new Headers()
  headers.set('Content-Type', contentType)
  headers.set('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`)

  return new Response(fileData, { headers })
})
