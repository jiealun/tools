import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { productsRoute } from './routes/products'
import { adminRoute } from './routes/admin'
import { downloadRoute } from './routes/download'
import { uploadRoute } from './routes/upload'
import { payRoute } from './routes/pay'

export type Env = {
  SUPABASE_URL: string
  SUPABASE_SERVICE_KEY: string
  ADMIN_USERNAME: string
  ADMIN_PASSWORD: string
  JWT_SECRET: string
  XUNHU_APPID: string
  XUNHU_SECRET: string
  XUNHU_GATEWAY: string
}

const app = new Hono<{ Bindings: Env }>()

// CORS
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}))

// 健康检查
app.get('/', (c) => c.json({ status: 'ok', message: 'Toolbox API' }))

// 路由
app.route('/api/products', productsRoute)
app.route('/api/admin', adminRoute)
app.route('/api/download', downloadRoute)
app.route('/api/upload', uploadRoute)
app.route('/api/pay', payRoute)

export default app
