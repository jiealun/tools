import { Context, Next } from 'hono'
import { Env } from '../index'

// 简单的 JWT 实现（适用于 Cloudflare Workers）
export async function signToken(payload: object, secret: string): Promise<string> {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = btoa(JSON.stringify({ ...payload, exp: Date.now() + 24 * 60 * 60 * 1000 }))
  const data = `${header}.${body}`

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data))
  const sig = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

  return `${data}.${sig}`
}

export async function verifyToken(token: string, secret: string): Promise<boolean> {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return false

    const data = `${parts[0]}.${parts[1]}`
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    )

    // 解码签名
    const sig = parts[2].replace(/-/g, '+').replace(/_/g, '/')
    const padded = sig + '='.repeat((4 - sig.length % 4) % 4)
    const sigBytes = Uint8Array.from(atob(padded), c => c.charCodeAt(0))

    const valid = await crypto.subtle.verify('HMAC', key, sigBytes, new TextEncoder().encode(data))
    if (!valid) return false

    // 检查过期
    const payload = JSON.parse(atob(parts[1]))
    if (payload.exp && payload.exp < Date.now()) return false

    return true
  } catch {
    return false
  }
}

// 鉴权中间件
export async function authMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
  const auth = c.req.header('Authorization')
  if (!auth || !auth.startsWith('Bearer ')) {
    return c.json({ error: '未授权' }, 401)
  }

  const token = auth.slice(7)
  const valid = await verifyToken(token, c.env.JWT_SECRET)
  if (!valid) {
    return c.json({ error: 'Token 无效或已过期' }, 401)
  }

  await next()
}
