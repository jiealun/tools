-- RainbowTools 客服后台增量迁移
-- 已有线上数据库请只执行本文件；新环境也可以执行 schema.sql 中对应的客服段落。

CREATE TABLE IF NOT EXISTS support_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_token VARCHAR(128) NOT NULL UNIQUE,
  page_url TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'open',
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS support_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES support_conversations(id) ON DELETE CASCADE,
  sender_type VARCHAR(20) NOT NULL,
  body TEXT,
  attachment_url TEXT,
  attachment_name VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_conversations_status_time
  ON support_conversations(status, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_messages_conversation_time
  ON support_messages(conversation_id, created_at ASC);

ALTER TABLE support_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;
