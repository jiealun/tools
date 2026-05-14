import { Hono } from 'hono'
import { Env } from '../index'
import { getSupabase } from '../lib/supabase'

export const productsRoute = new Hono<{ Bindings: Env }>()

// 获取已发布的产品列表（公开）
productsRoute.get('/', async (c) => {
  const supabase = getSupabase(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_KEY)
  const category = c.req.query('category')

  let query = supabase
    .from('products')
    .select('id, name, description, cover_url, price, category, download_count, ifaka_url, created_at')
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  if (category) {
    query = query.eq('category', category)
  }

  const { data, error } = await query

  if (error) {
    return c.json({ error: error.message }, 500)
  }

  return c.json({ data })
})

// 获取单个产品详情（公开）
productsRoute.get('/:id', async (c) => {
  const id = c.req.param('id')
  const supabase = getSupabase(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_KEY)

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .eq('is_published', true)
    .single()

  if (error || !data) {
    return c.json({ error: '产品不存在' }, 404)
  }

  return c.json({ data })
})
