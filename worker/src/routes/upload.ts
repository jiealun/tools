import { Hono } from 'hono'
import { Env } from '../index'
import { authMiddleware } from '../lib/auth'

export const uploadRoute = new Hono<{ Bindings: Env }>()

// 所有上传接口需要鉴权
uploadRoute.use('*', authMiddleware)

// 上传文件到 R2
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

    // 生成文件 key
    const ext = file.name.split('.').pop() || 'zip'
    const fileKey = `products/${productId}/${Date.now()}.${ext}`

    // 上传到 R2
    await c.env.R2_BUCKET.put(fileKey, file.stream(), {
      httpMetadata: {
        contentType: file.type || 'application/octet-stream',
      },
    })

    return c.json({
      success: true,
      fileKey,
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

    // 验证是图片
    if (!file.type.startsWith('image/')) {
      return c.json({ error: '请上传图片文件' }, 400)
    }

    const ext = file.name.split('.').pop() || 'png'
    const fileKey = `covers/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    await c.env.R2_BUCKET.put(fileKey, file.stream(), {
      httpMetadata: {
        contentType: file.type,
      },
    })

    return c.json({
      success: true,
      fileKey,
      // 返回公开访问URL（需要在R2设置公开访问或用自定义域名）
      url: fileKey,
    })
  } catch (err: any) {
    return c.json({ error: err.message || '上传失败' }, 500)
  }
})
