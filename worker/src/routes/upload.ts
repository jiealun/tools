import { Hono } from 'hono'
import { Env } from '../index'
import { authMiddleware } from '../lib/auth'
import { getSupabase } from '../lib/supabase'

export const uploadRoute = new Hono<{ Bindings: Env }>()

// 所有上传接口需要鉴权
uploadRoute.use('*', authMiddleware)

// 上传文件到 Supabase Storage
uploadRoute.post('/file', async (c) => {
  try {
    const formData = await c.req.formData()
    const file = formData.get('file') as File | null
    const productId = formData.get('productId') as string | null

    if (!file) {
      return c.json({ error: '请选择文件' }, 400)
    }

    if (!productId) {
      return c.json({ error: '请指定产品ID' }, 400)
    }

    const supabase = getSupabase(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_KEY)

    // 生成文件路径
    const ext = file.name.split('.').pop() || 'zip'
    const filePath = `products/${productId}/${Date.now()}.${ext}`

    // 上传到 Supabase Storage
    const arrayBuffer = await file.arrayBuffer()
    const { data, error } = await supabase.storage
      .from('toolbox')
      .upload(filePath, arrayBuffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: true,
      })

    if (error) {
      return c.json({ error: error.message }, 500)
    }

    return c.json({
      success: true,
      fileKey: filePath,
      fileName: file.name,
      fileSize: file.size,
    })
  } catch (err: any) {
    return c.json({ error: err.message || '上传失败' }, 500)
  }
})

// 上传封面图
uploadRoute.post('/cover', async (c) => {
  try {
    const formData = await c.req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return c.json({ error: '请选择图片' }, 400)
    }

    if (!file.type.startsWith('image/')) {
      return c.json({ error: '请上传图片文件' }, 400)
    }

    const supabase = getSupabase(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_KEY)

    const ext = file.name.split('.').pop() || 'png'
    const filePath = `covers/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const arrayBuffer = await file.arrayBuffer()
    const { data, error } = await supabase.storage
      .from('toolbox')
      .upload(filePath, arrayBuffer, {
        contentType: file.type,
        upsert: true,
      })

    if (error) {
      return c.json({ error: error.message }, 500)
    }

    // 获取公开URL
    const { data: urlData } = supabase.storage
      .from('toolbox')
      .getPublicUrl(filePath)

    return c.json({
      success: true,
      fileKey: filePath,
      url: urlData.publicUrl,
    })
  } catch (err: any) {
    return c.json({ error: err.message || '上传失败' }, 500)
  }
})
