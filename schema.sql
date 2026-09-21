-- Supabase 数据库 Schema
-- 在 Supabase SQL Editor 中执行

-- 工具/产品表
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  cover_url TEXT,
  screenshots TEXT[], -- 截图URL数组
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  category VARCHAR(50) DEFAULT 'plugin', -- plugin/tutorial/tool
  download_url TEXT, -- R2 加密ZIP下载地址
  ifaka_url TEXT, -- 爱发卡购买链接
  download_count INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 激活码表
CREATE TABLE activation_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  code VARCHAR(100) NOT NULL,
  is_used BOOLEAN DEFAULT false,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 下载记录表
CREATE TABLE download_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  ip VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 管理员表
CREATE TABLE admins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(200) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_products_published ON products(is_published);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_activation_codes_product ON activation_codes(product_id);
CREATE INDEX idx_activation_codes_code ON activation_codes(code);
CREATE INDEX idx_download_logs_product ON download_logs(product_id);

-- 更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- RLS 策略（Supabase Row Level Security）
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE activation_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE download_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- 公开读取已发布的产品
CREATE POLICY "Public can view published products" ON products
  FOR SELECT USING (is_published = true);

-- 通过 service_role key 在 Worker 中操作所有数据（绕过 RLS）

-- 添加购买链接字段（在 Supabase SQL Editor 中执行）
ALTER TABLE products ADD COLUMN IF NOT EXISTS buy_url TEXT DEFAULT '';

-- 订单表（虎皮椒支付）
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_no VARCHAR(64) UNIQUE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending / paid
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_order_no ON orders(order_no);
CREATE INDEX IF NOT EXISTS idx_orders_product ON orders(product_id);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- 客服会话与消息
CREATE TABLE IF NOT EXISTS support_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_token VARCHAR(128) NOT NULL UNIQUE,
  page_url TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'open', -- open / closed
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS support_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES support_conversations(id) ON DELETE CASCADE,
  sender_type VARCHAR(20) NOT NULL, -- visitor / agent / system
  body TEXT,
  attachment_url TEXT,
  attachment_name VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT support_messages_has_content CHECK (NULLIF(BTRIM(COALESCE(body, '')), '') IS NOT NULL OR attachment_url IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_support_conversations_status_time
  ON support_conversations(status, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_messages_conversation_time
  ON support_messages(conversation_id, created_at ASC);

ALTER TABLE support_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

-- 访客消息统一经过 Worker 写入，Worker 使用 service_role key 绕过 RLS。
