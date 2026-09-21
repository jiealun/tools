import { ChangeEvent, FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react'
import { ChatIcon, CloseIcon, PaperclipIcon, SendIcon } from './SiteIcons'
import { fetchAPI } from '../lib/api'

interface ChatMessage {
  id: string
  role: 'visitor' | 'agent'
  text?: string
  image?: string
  fileName?: string
  createdAt: string
}

interface PendingAttachment {
  url: string
  fileName: string
}

interface RemoteMessage {
  id: string
  sender_type: 'visitor' | 'agent' | 'system'
  body: string | null
  attachment_url: string | null
  attachment_name: string | null
  created_at: string
}

const STORAGE_KEY = 'rainbowtools-support-messages'
const VISITOR_TOKEN_KEY = 'rainbowtools-support-visitor-token'
const WELCOME_TEXT = '你好，需要了解工具？还是遇到了使用问题？可以直接留言或发送截图。'

const initialMessages: ChatMessage[] = [
  {
    id: 'welcome',
    role: 'agent',
    text: WELCOME_TEXT,
    createdAt: new Date().toISOString(),
  },
]

function getVisitorToken() {
  if (typeof window === 'undefined') return ''

  try {
    const stored = window.localStorage.getItem(VISITOR_TOKEN_KEY)
    if (stored) return stored

    const token = typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`
    window.localStorage.setItem(VISITOR_TOKEN_KEY, token)
    return token
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`
  }
}

function readStoredMessages() {
  if (typeof window === 'undefined') return initialMessages

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) return initialMessages
    const messages = JSON.parse(stored) as ChatMessage[]
    if (!Array.isArray(messages) || messages.length === 0) return initialMessages
    return messages.map((message) => message.id === 'welcome' ? { ...message, text: WELCOME_TEXT } : message)
  } catch {
    return initialMessages
  }
}

function formatMessageTime(value: string) {
  return new Intl.DateTimeFormat('zh-CN', { hour: '2-digit', minute: '2-digit' }).format(new Date(value))
}

function mapRemoteMessage(message: RemoteMessage): ChatMessage {
  return {
    id: message.id,
    role: message.sender_type === 'visitor' ? 'visitor' : 'agent',
    text: message.body || undefined,
    image: message.attachment_url || undefined,
    fileName: message.attachment_name || undefined,
    createdAt: message.created_at,
  }
}

function dataUrlToBlob(dataUrl: string) {
  const [metadata, data] = dataUrl.split(',')
  const mime = metadata.match(/:(.*?);/)?.[1] || 'image/png'
  const binary = atob(data)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
  return new Blob([bytes], { type: mime })
}

export default function CustomerSupportWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>(readStoredMessages)
  const [draft, setDraft] = useState('')
  const [attachment, setAttachment] = useState<PendingAttachment | null>(null)
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const [remoteReady, setRemoteReady] = useState(false)
  const [conversationId, setConversationId] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const launcherRef = useRef<HTMLButtonElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const visitorTokenRef = useRef(getVisitorToken())

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
    } catch {
      // 图片较大时可能超出本地存储容量，但不影响服务器发送。
    }
  }, [messages])

  useEffect(() => {
    if (open) {
      inputRef.current?.focus()
      void connectRemote()
    } else {
      launcherRef.current?.focus()
    }
  }, [open])

  useEffect(() => {
    if (!open || !remoteReady || !conversationId) return
    const timer = window.setInterval(() => {
      void loadRemoteMessages(conversationId, true)
    }, 4000)
    return () => window.clearInterval(timer)
  }, [open, remoteReady, conversationId])

  async function ensureRemoteConversation() {
    const res = await fetchAPI('/api/support/conversations', {
      method: 'POST',
      body: JSON.stringify({ visitorToken: visitorTokenRef.current, pageUrl: window.location.href }),
    })
    if (!res.data?.id) throw new Error(res.error || '无法创建客服会话')
    setConversationId(res.data.id)
    setRemoteReady(true)
    return res.data.id as string
  }

  async function loadRemoteMessages(id: string, silent = false) {
    try {
      const res = await fetchAPI(`/api/support/conversations/${id}/messages?visitorToken=${encodeURIComponent(visitorTokenRef.current)}`)
      if (res.error) throw new Error(res.error)
      const remoteMessages = (res.data || []) as RemoteMessage[]
      setMessages(remoteMessages.length > 0 ? remoteMessages.map(mapRemoteMessage) : initialMessages)
      if (!silent) setError('')
    } catch (loadError: any) {
      if (!silent) throw loadError
    }
  }

  async function connectRemote() {
    try {
      setError('')
      const id = await ensureRemoteConversation()
      await loadRemoteMessages(id)
    } catch {
      setRemoteReady(false)
      setError('客服服务暂时无法连接，消息会在本地保留，请稍后重试。')
    }
  }

  function handleAttachment(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('目前只支持发送图片截图')
      return
    }

    if (file.size > 8 * 1024 * 1024) {
      setError('图片大小不能超过 8MB')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setAttachment({ url: String(reader.result), fileName: file.name })
      setError('')
    }
    reader.onerror = () => setError('图片读取失败，请重试')
    reader.readAsDataURL(file)
  }

  async function uploadAttachment(id: string, item: PendingAttachment) {
    const formData = new FormData()
    formData.append('file', dataUrlToBlob(item.url), item.fileName)
    formData.append('conversationId', id)
    formData.append('visitorToken', visitorTokenRef.current)
    const res = await fetchAPI('/api/support/attachments', { method: 'POST', body: formData })
    if (!res.url) throw new Error(res.error || '截图上传失败')
    return { url: res.url as string, fileName: (res.fileName || item.fileName) as string }
  }

  async function handleSend(event?: FormEvent) {
    event?.preventDefault()
    const text = draft.trim()
    if ((!text && !attachment) || sending) return

    const localMessage: ChatMessage = {
      id: `${Date.now()}-visitor`,
      role: 'visitor',
      text: text || undefined,
      image: attachment?.url,
      fileName: attachment?.fileName,
      createdAt: new Date().toISOString(),
    }
    setMessages((current) => [...current, localMessage])
    setDraft('')
    setError('')
    setSending(true)

    try {
      const id = conversationId || await ensureRemoteConversation()
      const uploaded = attachment ? await uploadAttachment(id, attachment) : null
      const res = await fetchAPI(`/api/support/conversations/${id}/messages`, {
        method: 'POST',
        body: JSON.stringify({
          visitorToken: visitorTokenRef.current,
          text,
          attachmentUrl: uploaded?.url,
          attachmentName: uploaded?.fileName,
        }),
      })
      if (res.error) throw new Error(res.error)
      setAttachment(null)
      await loadRemoteMessages(id)
    } catch {
      setRemoteReady(false)
      setError('消息暂未发送成功，请稍后点击发送重试。')
    } finally {
      setSending(false)
    }
  }

  function handleInputKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void handleSend()
    }
  }

  return (
    <div className={`support-widget${open ? ' is-open' : ''}`}>
      {!open && (
        <button ref={launcherRef} type="button" className="support-widget__launcher" onClick={() => setOpen(true)} aria-expanded={false} aria-controls="customer-support-dialog">
          <span className="support-widget__launcher-icon"><ChatIcon /></span>
          <span>联系客服</span>
          <span className="support-widget__online-dot" aria-label="客服在线" />
        </button>
      )}

      {open && (
        <section id="customer-support-dialog" className="support-widget__panel" role="dialog" aria-modal="false" aria-labelledby="customer-support-title">
          <header className="support-widget__header">
            <div className="support-widget__identity">
              <span className="support-widget__avatar"><ChatIcon /></span>
              <div>
                <h2 id="customer-support-title">在线客服</h2>
                <p><span className={`support-widget__status-dot${remoteReady ? '' : ' is-offline'}`} />{remoteReady ? '通常会在 5 分钟内回复' : '正在连接客服服务'}</p>
              </div>
            </div>
            <button type="button" className="support-widget__close" onClick={() => setOpen(false)} aria-label="关闭客服窗口"><CloseIcon /></button>
          </header>

          <div className="support-widget__messages" role="log" aria-live="polite" aria-label="客服消息">
            <div className="support-widget__day-label">今天</div>
            {messages.map((message) => (
              <div key={message.id} className={`support-widget__message support-widget__message--${message.role}`}>
                <div className="support-widget__bubble">
                  {message.text && <p>{message.text}</p>}
                  {message.image && <img src={message.image} alt={`发送的截图：${message.fileName || '图片'}`} />}
                </div>
                <time dateTime={message.createdAt}>{formatMessageTime(message.createdAt)}</time>
              </div>
            ))}
          </div>

          <form className="support-widget__composer" onSubmit={(event) => void handleSend(event)}>
            {attachment && (
              <div className="support-widget__attachment-preview">
                <img src={attachment.url} alt={`待发送截图：${attachment.fileName}`} />
                <span title={attachment.fileName}>{attachment.fileName}</span>
                <button type="button" onClick={() => setAttachment(null)} aria-label="移除截图"><CloseIcon /></button>
              </div>
            )}
            {error && <p className="support-widget__error" role="alert">{error}</p>}
            <div className="support-widget__composer-row">
              <button type="button" className="support-widget__tool-button" onClick={() => fileInputRef.current?.click()} aria-label="发送截图"><PaperclipIcon /></button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAttachment} hidden />
              <textarea ref={inputRef} value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={handleInputKeyDown} placeholder="输入消息，Enter 发送" rows={1} aria-label="输入客服消息" />
              <button type="submit" className="support-widget__send" disabled={sending || (!draft.trim() && !attachment)} aria-label="发送消息"><SendIcon /></button>
            </div>
            <p className="support-widget__hint">支持发送文字和截图 · Shift + Enter 换行</p>
          </form>
        </section>
      )}
    </div>
  )
}
