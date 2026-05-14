import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { productsRoute } from './routes/products'
import { adminRoute } from './routes/admin'
import { downloadRoute } from './routes/download'
import { uploadRoute } from './routes/upload'

export type Env = {
  R2_BUCKET: R2Bucket
  SUPABASE_URL: string
  SUPABASE_SERVICE_KEY: string
  ADMIN_USERNAME: string
  ADMIN_PASSWORD: string
  JWT_SECRET: string
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

export default app
