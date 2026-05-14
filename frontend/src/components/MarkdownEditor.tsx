import { useState, useRef } from 'react'

interface Props {
  value: string
  onChange: (value: string) => void
}

export default function MarkdownEditor({ value, onChange }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [preview, setPreview] = useState(false)

  function insertText(before: string, after: string = '') {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selected = value.substring(start, end)
    const newText = value.substring(0, start) + before + selected + after + value.substring(end)
    onChange(newText)

    // 恢复光标位置
    setTimeout(() => {
      textarea.focus()
      textarea.selectionStart = start + before.length
      textarea.selectionEnd = start + before.length + selected.length
    }, 0)
  }

  const tools = [
    { label: 'H1', action: () => insertText('# ') },
    { label: 'H2', action: () => insertText('## ') },
    { label: 'H3', action: () => insertText('### ') },
    { label: 'B', action: () => insertText('**', '**') },
    { label: 'I', action: () => insertText('*', '*') },
    { label: '列表', action: () => insertText('- ') },
    { label: '有序', action: () => insertText('1. ') },
    { label: '引用', action: () => insertText('> ') },
    { label: '代码', action: () => insertText('`', '`') },
    { label: '链接', action: () => insertText('[', '](url)') },
    { label: '图片', action: () => insertText('![alt](', ')') },
    { label: '分割线', action: () => insertText('\n---\n') },
  ]

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* 工具栏 */}
      <div className="flex items-center gap-1 px-2 py-1.5 bg-gray-50 border-b flex-wrap">
        {tools.map((tool) => (
          <button
            key={tool.label}
            type="button"
            onClick={tool.action}
            className="px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-200 rounded transition"
          >
            {tool.label}
          </button>
        ))}
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => setPreview(!preview)}
          className={`px-2 py-1 text-xs rounded transition ${
            preview ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-200'
          }`}
        >
          {preview ? '编辑' : '预览'}
        </button>
      </div>

      {/* 编辑区/预览区 */}
      {preview ? (
        <div
          className="p-4 min-h-[200px] prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: simpleMarkdown(value) }}
        />
      ) : (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={10}
          placeholder="支持 Markdown 格式，如 **加粗**、# 标题、- 列表 等"
          className="w-full px-4 py-3 outline-none resize-y text-sm font-mono"
        />
      )}
    </div>
  )
}

// 简单的 Markdown 转 HTML（用于预览）
function simpleMarkdown(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // 标题
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // 加粗和斜体
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // 代码
    .replace(/`(.+?)`/g, '<code class="bg-gray-100 px-1 rounded">$1</code>')
    // 链接
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-blue-500 underline">$1</a>')
    // 图片
    .replace(/!\[(.+?)\]\((.+?)\)/g, '<img src="$2" alt="$1" class="rounded max-w-full" />')
    // 引用
    .replace(/^&gt; (.+)$/gm, '<blockquote class="border-l-4 border-gray-300 pl-3 text-gray-600">$1</blockquote>')
    // 分割线
    .replace(/^---$/gm, '<hr class="my-4" />')
    // 无序列表
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    // 有序列表
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    // 换行
    .replace(/\n/g, '<br />')
}
