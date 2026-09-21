import { Hono } from 'hono'
import { Env } from '../index'
import { getSupabase } from '../lib/supabase'
import { signToken, authMiddleware } from '../lib/auth'
import { MAX_MESSAGE_LENGTH } from './support'

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
      buy_url: body.buy_url || '',
      is_published: body.is_published || false,
      download_count: Math.floor(Math.random() * 81) + 20,
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
      buy_url: body.buy_url,
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

// 客服会话列表
adminRoute.get('/support/conversations', async (c) => {
  const supabase = getSupabase(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_KEY)
  const { data, error } = await supabase
    .from('support_conversations')
    .select('*')
    .order('last_message_at', { ascending: false })
    .limit(100)

  if (error) return c.json({ error: error.message }, 500)

  const conversations = await Promise.all((data || []).map(async (conversation) => {
    const latest = await supabase
      .from('support_messages')
      .select('body, attachment_url, sender_type, created_at')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    return { ...conversation, latest_message: latest.data || null }
  }))

  return c.json({ data: conversations })
})

// 客服查看单个会话消息
adminRoute.get('/support/conversations/:id/messages', async (c) => {
  const supabase = getSupabase(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_KEY)
  const { data, error } = await supabase
    .from('support_messages')
    .select('*')
    .eq('conversation_id', c.req.param('id'))
    .order('created_at', { ascending: true })

  if (error) return c.json({ error: error.message }, 500)
  return c.json({ data: data || [] })
})

// 客服回复消息
adminRoute.post('/support/conversations/:id/messages', async (c) => {
  const body = await c.req.json<{ text?: string }>()
  const text = typeof body.text === 'string' ? body.text.trim() : ''
  if (!text) return c.json({ error: '回复内容不能为空' }, 400)
  if (text.length > MAX_MESSAGE_LENGTH) return c.json({ error: '消息不能超过 5000 个字符' }, 400)

  const supabase = getSupabase(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_KEY)
  const id = c.req.param('id')
  const { data, error } = await supabase
    .from('support_messages')
    .insert({ conversation_id: id, sender_type: 'agent', body: text })
    .select()
    .single()

  if (error) return c.json({ error: error.message }, 500)
  await supabase
    .from('support_conversations')
    .update({ last_message_at: new Date().toISOString(), status: 'open' })
    .eq('id', id)

  return c.json({ data })
})

// 关闭或重新打开会话
adminRoute.patch('/support/conversations/:id', async (c) => {
  const body = await c.req.json<{ status?: string }>()
  if (body.status !== 'open' && body.status !== 'closed') return c.json({ error: '会话状态无效' }, 400)

  const supabase = getSupabase(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_KEY)
  const { data, error } = await supabase
    .from('support_conversations')
    .update({ status: body.status })
    .eq('id', c.req.param('id'))
    .select()
    .single()

  if (error) return c.json({ error: error.message }, 500)
  return c.json({ data })
})
