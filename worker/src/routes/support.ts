import { Hono } from 'hono'
import { Env } from '../index'
import { getSupabase } from '../lib/supabase'

export const supportRoute = new Hono<{ Bindings: Env }>()

const MAX_TOKEN_LENGTH = 128
const MAX_MESSAGE_LENGTH = 5000
const MAX_ATTACHMENT_SIZE = 8 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp'])

function validVisitorToken(value: unknown): value is string {
  return typeof value === 'string' && value.length >= 16 && value.length <= MAX_TOKEN_LENGTH
}

async function getConversation(supabase: ReturnType<typeof getSupabase>, id: string, visitorToken: string) {
  const { data, error } = await supabase
    .from('support_conversations')
    .select('id, status')
    .eq('id', id)
    .eq('visitor_token', visitorToken)
    .single()

  return { data, error }
}

async function touchConversation(supabase: ReturnType<typeof getSupabase>, id: string) {
  await supabase
    .from('support_conversations')
    .update({ last_message_at: new Date().toISOString(), status: 'open' })
    .eq('id', id)
}

// 创建或恢复当前浏览器的客服会话
supportRoute.post('/conversations', async (c) => {
  const body = await c.req.json<{ visitorToken?: string; pageUrl?: string }>()
  const visitorToken = body.visitorToken

  if (!validVisitorToken(visitorToken)) {
    return c.json({ error: '访客会话标识无效' }, 400)
  }

  const supabase = getSupabase(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_KEY)
  const existing = await supabase
    .from('support_conversations')
    .select('*')
    .eq('visitor_token', visitorToken)
    .maybeSingle()

  if (existing.error) return c.json({ error: existing.error.message }, 500)
  if (existing.data) {
    if (existing.data.status === 'closed') {
      const reopened = await supabase
        .from('support_conversations')
        .update({ status: 'open', last_message_at: new Date().toISOString() })
        .eq('id', existing.data.id)
        .select()
        .single()
      if (reopened.error) return c.json({ error: reopened.error.message }, 500)
      return c.json({ data: reopened.data })
    }
    return c.json({ data: existing.data })
  }

  const { data, error } = await supabase
    .from('support_conversations')
    .insert({ visitor_token: visitorToken, page_url: body.pageUrl || '' })
    .select()
    .single()

  if (error) return c.json({ error: error.message }, 500)
  return c.json({ data })
})

// 获取访客自己的消息
supportRoute.get('/conversations/:id/messages', async (c) => {
  const visitorToken = c.req.query('visitorToken')
  const id = c.req.param('id')

  if (!validVisitorToken(visitorToken)) return c.json({ error: '访客会话标识无效' }, 400)

  const supabase = getSupabase(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_KEY)
  const conversation = await getConversation(supabase, id, visitorToken)
  if (conversation.error || !conversation.data) return c.json({ error: '会话不存在' }, 404)

  const { data, error } = await supabase
    .from('support_messages')
    .select('*')
    .eq('conversation_id', id)
    .order('created_at', { ascending: true })

  if (error) return c.json({ error: error.message }, 500)
  return c.json({ data: data || [] })
})

// 访客发送文字或截图消息
supportRoute.post('/conversations/:id/messages', async (c) => {
  const body = await c.req.json<{
    visitorToken?: string
    text?: string
    attachmentUrl?: string
    attachmentName?: string
  }>()
  const visitorToken = body.visitorToken
  const text = typeof body.text === 'string' ? body.text.trim() : ''

  if (!validVisitorToken(visitorToken)) return c.json({ error: '访客会话标识无效' }, 400)
  if (!text && !body.attachmentUrl) return c.json({ error: '消息不能为空' }, 400)
  if (text.length > MAX_MESSAGE_LENGTH) return c.json({ error: '消息不能超过 5000 个字符' }, 400)

  const supabase = getSupabase(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_KEY)
  const id = c.req.param('id')
  const conversation = await getConversation(supabase, id, visitorToken)
  if (conversation.error || !conversation.data) return c.json({ error: '会话不存在' }, 404)

  const { data, error } = await supabase
    .from('support_messages')
    .insert({
      conversation_id: id,
      sender_type: 'visitor',
      body: text || null,
      attachment_url: body.attachmentUrl || null,
      attachment_name: body.attachmentName || null,
    })
    .select()
    .single()

  if (error) return c.json({ error: error.message }, 500)
  await touchConversation(supabase, id)
  return c.json({ data })
})

// 访客截图上传到 Supabase Storage，数据库只保存公开 URL
supportRoute.post('/attachments', async (c) => {
  const formData = await c.req.formData()
  const file = formData.get('file')
  const conversationId = formData.get('conversationId')
  const visitorToken = formData.get('visitorToken')

  if (!(file instanceof File) || typeof conversationId !== 'string' || !validVisitorToken(visitorToken)) {
    return c.json({ error: '上传参数无效' }, 400)
  }
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) return c.json({ error: '仅支持 JPG、PNG、GIF 或 WebP 图片' }, 400)
  if (file.size > MAX_ATTACHMENT_SIZE) return c.json({ error: '图片不能超过 8MB' }, 400)

  const supabase = getSupabase(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_KEY)
  const conversation = await getConversation(supabase, conversationId, visitorToken)
  if (conversation.error || !conversation.data) return c.json({ error: '会话不存在' }, 404)

  const extension = file.name.split('.').pop()?.toLowerCase() || 'png'
  const filePath = `support/${conversationId}/${Date.now()}-${crypto.randomUUID()}.${extension}`
  const { error } = await supabase.storage
    .from('toolbox')
    .upload(filePath, await file.arrayBuffer(), { contentType: file.type, upsert: false })

  if (error) return c.json({ error: error.message }, 500)
  const { data: urlData } = supabase.storage.from('toolbox').getPublicUrl(filePath)
  return c.json({ url: urlData.publicUrl, fileName: file.name })
})

export { MAX_MESSAGE_LENGTH }
