import { Hono } from 'hono'
import { Env } from '../index'
import { getSupabase } from '../lib/supabase'

export const downloadRoute = new Hono<{ Bindings: Env }>()

// 验证激活码并下载
downloadRoute.post('/:productId', async (c) => {
  const productId = c.req.param('productId')
  const { code } = await c.req.json()
  const supabase = getSupabase(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_KEY)

  if (!code || !code.trim()) {
    return c.json({ error: '请输入激活码' }, 400)
  }

  // 获取产品信息
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('id, name, download_url, is_published, download_count')
    .eq('id', productId)
    .eq('is_published', true)
    .single()

  if (productError || !product) {
    return c.json({ error: '产品不存在' }, 404)
  }

  if (!product.download_url) {
    return c.json({ error: '文件暂未上传' }, 404)
  }

  // 验证激活码
  const { data: codeRecord, error: codeError } = await supabase
    .from('activation_codes')
    .select('id, code, is_used')
    .eq('product_id', productId)
    .eq('code', code.trim())
    .single()

  if (codeError || !codeRecord) {
    return c.json({ error: '激活码无效' }, 403)
  }

  if (codeRecord.is_used) {
    return c.json({ error: '该激活码已被使用' }, 403)
  }

  // 标记激活码为已使用
  await supabase
    .from('activation_codes')
    .update({ is_used: true, used_at: new Date().toISOString() })
    .eq('id', codeRecord.id)

  // 记录下载
  const ip = c.req.header('CF-Connecting-IP') || 'unknown'
  const userAgent = c.req.header('User-Agent') || ''

  await supabase.from('download_logs').insert({
    product_id: productId,
    ip,
    user_agent: userAgent,
  })

  // 更新下载计数
  await supabase
    .from('products')
    .update({ download_count: (product.download_count || 0) + 1 })
    .eq('id', productId)

  // 从 Supabase Storage 下载文件
  const { data: fileData, error: downloadError } = await supabase.storage
    .from('toolbox')
    .download(product.download_url)

  if (downloadError || !fileData) {
    return c.json({ error: '文件不存在' }, 404)
  }

  const headers = new Headers()
  headers.set('Content-Type', 'application/zip')
  headers.set('Content-Disposition', `attachment; filename="${encodeURIComponent(product.name)}.zip"`)

  return new Response(fileData, { headers })
})
