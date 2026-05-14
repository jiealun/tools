import { Hono } from 'hono'
import { Env } from '../index'
import { getSupabase } from '../lib/supabase'
import { signToken, authMiddleware } from '../lib/auth'

export const adminRoute = new Hono<{ Bindings: Env }>()

// 管理员登录
adminRoute.post('/login', async (c) => {
  const { username, password } = await c.req.json()

  if (username !== c.env.ADMIN_USERNAME || password !== c.env.ADMIN_PASSWORD) {
    return c.json({ error: '用户名或密码错误' }, 401)
  }

  const token = await signToken({ username, role: 'admin' }, c.env.JWT_SECRET)
  return c.json({ token })
})

// 以下接口需要鉴权
adminRoute.use('/*', authMiddleware)

// 获取所有产品（包括未发布的）
adminRoute.get('/products', async (c) => {
  const supabase = getSupabase(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_KEY)

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return c.json({ error: error.message }, 500)
  return c.json({ data })
})

// 获取单个产品详情
adminRoute.get('/products/:id', async (c) => {
  const id = c.req.param('id')
  const supabase = getSupabase(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_KEY)

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return c.json({ error: error.message }, 500)
  return c.json({ data })
})

// 创建产品
adminRoute.post('/products', async (c) => {
  const body = await c.req.json()
  const supabase = getSupabase(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_KEY)

  const { data, error } = await supabase
    .from('products')
    .insert({
      name: body.name,
      description: body.description || '',
      cover_url: body.cover_url || '',
      screenshots: body.screenshots || [],
      price: body.price || 0,
      category: body.category || 'plugin',
      ifaka_url: body.ifaka_url || '',
      is_published: body.is_published || false,
    })
    .select()
    .single()

  if (error) return c.json({ error: error.message }, 500)
  return c.json({ data })
})

// 更新产品
adminRoute.put('/products/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const supabase = getSupabase(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_KEY)

  const { data, error } = await supabase
    .from('products')
    .update({
      name: body.name,
      description: body.description,
      cover_url: body.cover_url,
      screenshots: body.screenshots,
      price: body.price,
      category: body.category,
      download_url: body.download_url,
      ifaka_url: body.ifaka_url,
      is_published: body.is_published,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return c.json({ error: error.message }, 500)
  return c.json({ data })
})

// 删除产品
adminRoute.delete('/products/:id', async (c) => {
  const id = c.req.param('id')
  const supabase = getSupabase(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_KEY)

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)

  if (error) return c.json({ error: error.message }, 500)
  return c.json({ success: true })
})

// 获取产品的激活码列表
adminRoute.get('/products/:id/codes', async (c) => {
  const productId = c.req.param('id')
  const supabase = getSupabase(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_KEY)

  const { data, error } = await supabase
    .from('activation_codes')
    .select('*')
    .eq('product_id', productId)
    .order('created_at', { ascending: false })

  if (error) return c.json({ error: error.message }, 500)
  return c.json({ data })
})

// 批量添加激活码
adminRoute.post('/products/:id/codes', async (c) => {
  const productId = c.req.param('id')
  const { codes } = await c.req.json() // codes: string[]
  const supabase = getSupabase(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_KEY)

  if (!codes || !Array.isArray(codes) || codes.length === 0) {
    return c.json({ error: '请提供激活码列表' }, 400)
  }

  const records = codes.map((code: string) => ({
    product_id: productId,
    code: code.trim(),
  }))

  const { data, error } = await supabase
    .from('activation_codes')
    .insert(records)
    .select()

  if (error) return c.json({ error: error.message }, 500)
  return c.json({ data, count: records.length })
})

// 删除激活码
adminRoute.delete('/codes/:id', async (c) => {
  const id = c.req.param('id')
  const supabase = getSupabase(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_KEY)

  const { error } = await supabase
    .from('activation_codes')
    .delete()
    .eq('id', id)

  if (error) return c.json({ error: error.message }, 500)
  return c.json({ success: true })
})

// 数据统计
adminRoute.get('/stats', async (c) => {
  const supabase = getSupabase(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_KEY)

  const [products, codes, downloads] = await Promise.all([
    supabase.from('products').select('id', { count: 'exact' }),
    supabase.from('activation_codes').select('id, is_used', { count: 'exact' }),
    supabase.from('download_logs').select('id', { count: 'exact' }),
  ])

  const usedCodes = codes.data?.filter((c: any) => c.is_used).length || 0

  return c.json({
    totalProducts: products.count || 0,
    totalCodes: codes.count || 0,
    usedCodes,
    totalDownloads: downloads.count || 0,
  })
})
