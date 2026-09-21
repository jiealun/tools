import { FormEvent, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { fetchAPI, isLoggedIn } from '../../lib/api'

interface Conversation {
  id: string
  status: 'open' | 'closed'
  visitor_token: string
  page_url: string | null
  last_message_at: string
  created_at: string
  latest_message: {
    body: string | null
    attachment_url: string | null
    sender_type: 'visitor' | 'agent' | 'system'
    created_at: string
  } | null
}

interface Message {
  id: string
  sender_type: 'visitor' | 'agent' | 'system'
  body: string | null
  attachment_url: string | null
  attachment_name: string | null
  created_at: string
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
}

export default function AdminSupport() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate('/admin/login')
      return
    }
    void loadConversations()
  }, [])

  useEffect(() => {
    if (!selectedId) return
    void loadMessages(selectedId)
    const timer = window.setInterval(() => void loadMessages(selectedId), 4000)
    return () => window.clearInterval(timer)
  }, [selectedId])

  async function loadConversations() {
    try {
      const res = await fetchAPI('/api/admin/support/conversations')
      if (res.error) throw new Error(res.error)
      const data = (res.data || []) as Conversation[]
      setConversations(data)
      setSelectedId((current) => current || data[0]?.id || '')
      setError('')
    } catch (loadError: any) {
      setError(loadError.message || '客服会话加载失败，请先执行客服数据库迁移')
    } finally {
      setLoading(false)
    }
  }

  async function loadMessages(id: string) {
    const res = await fetchAPI(`/api/admin/support/conversations/${id}/messages`)
    if (!res.error) setMessages((res.data || []) as Message[])
  }

  async function handleSend(event: FormEvent) {
    event.preventDefault()
    const text = draft.trim()
    if (!text || !selectedId || sending) return

    setSending(true)
    try {
      const res = await fetchAPI(`/api/admin/support/conversations/${selectedId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ text }),
      })
      if (res.error) throw new Error(res.error)
      setDraft('')
      await loadMessages(selectedId)
      await loadConversations()
    } catch (sendError: any) {
      setError(sendError.message || '回复发送失败')
    } finally {
      setSending(false)
    }
  }

  async function toggleStatus(conversation: Conversation) {
    const status = conversation.status === 'open' ? 'closed' : 'open'
    await fetchAPI(`/api/admin/support/conversations/${conversation.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
    await loadConversations()
  }

  const selected = conversations.find((item) => item.id === selectedId)

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-4">
            <Link to="/admin" className="text-sm text-slate-400 hover:text-slate-900">← 返回后台</Link>
            <div>
              <h1 className="text-lg font-bold">客服工作台</h1>
              <p className="mt-0.5 text-xs text-slate-400">处理网站访客的咨询与截图</p>
            </div>
          </div>
          <button onClick={() => void loadConversations()} className="rounded-lg border px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">刷新会话</button>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl grid-cols-[300px_minmax(0,1fr)] gap-5 px-5 py-5">
        <aside className="overflow-hidden rounded-2xl border bg-white">
          <div className="border-b px-4 py-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">全部会话</h2>
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-600">{conversations.length}</span>
            </div>
          </div>
          <div className="max-h-[calc(100vh-150px)] overflow-y-auto">
            {loading ? (
              <p className="px-4 py-10 text-center text-sm text-slate-400">加载中...</p>
            ) : conversations.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-slate-400">暂无访客消息</p>
            ) : conversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => setSelectedId(conversation.id)}
                className={`block w-full border-b px-4 py-4 text-left transition hover:bg-slate-50 ${selectedId === conversation.id ? 'bg-blue-50/70' : ''}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate text-sm font-medium">访客 · {conversation.visitor_token.slice(0, 8)}</span>
                  <span className={`h-2 w-2 rounded-full ${conversation.status === 'open' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                </div>
                <p className="mt-2 truncate text-xs text-slate-500">
                  {conversation.latest_message?.body || (conversation.latest_message?.attachment_url ? '发送了一张截图' : '暂无消息')}
                </p>
                <time className="mt-2 block text-[11px] text-slate-400">{formatTime(conversation.last_message_at)}</time>
              </button>
            ))}
          </div>
        </aside>

        <section className="flex min-h-[calc(100vh-150px)] flex-col overflow-hidden rounded-2xl border bg-white">
          {selected ? (
            <>
              <header className="flex items-center justify-between border-b px-5 py-4">
                <div>
                  <h2 className="text-sm font-semibold">访客 · {selected.visitor_token.slice(0, 12)}</h2>
                  <p className="mt-1 text-xs text-slate-400">首次咨询 {formatTime(selected.created_at)}</p>
                </div>
                <button onClick={() => void toggleStatus(selected)} className="rounded-lg border px-3 py-2 text-xs text-slate-600 hover:bg-slate-50">
                  {selected.status === 'open' ? '结束会话' : '重新打开'}
                </button>
              </header>

              <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50/70 p-5">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.sender_type === 'agent' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] ${message.sender_type === 'agent' ? 'items-end' : 'items-start'} flex flex-col`}>
                      <div className={`rounded-2xl px-4 py-3 text-sm leading-6 ${message.sender_type === 'agent' ? 'rounded-br-sm bg-blue-600 text-white' : 'rounded-bl-sm border bg-white text-slate-700'}`}>
                        {message.body && <p className="whitespace-pre-wrap">{message.body}</p>}
                        {message.attachment_url && <img src={message.attachment_url} alt={message.attachment_name || '访客截图'} className="mt-2 max-h-72 max-w-full rounded-lg object-contain" />}
                      </div>
                      <time className="mt-1 text-[11px] text-slate-400">{formatTime(message.created_at)}</time>
                    </div>
                  </div>
                ))}
                {messages.length === 0 && <p className="py-12 text-center text-sm text-slate-400">该会话暂无消息</p>}
              </div>

              <form onSubmit={handleSend} className="border-t bg-white p-4">
                {error && <p className="mb-2 text-xs text-red-500">{error}</p>}
                <div className="flex items-end gap-3">
                  <textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="输入回复内容，Enter 发送" rows={2} className="min-h-[48px] flex-1 resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void handleSend(event as unknown as FormEvent) } }} />
                  <button type="submit" disabled={sending || !draft.trim()} className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40">{sending ? '发送中' : '发送'}</button>
                </div>
                <p className="mt-2 text-[11px] text-slate-400">客服回复会实时同步到访客的聊天窗口</p>
              </form>
            </>
          ) : (
            <div className="grid flex-1 place-items-center text-sm text-slate-400">选择一个会话开始处理</div>
          )}
        </section>
      </main>
    </div>
  )
}
