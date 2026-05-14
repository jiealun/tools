import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { fetchAPI, isLoggedIn } from '../../lib/api'

interface Code {
  id: string
  code: string
  is_used: boolean
  used_at: string | null
  created_at: string
}

interface Product {
  id: string
  name: string
}

export default function AdminCodes() {
  const { id: productId } = useParams()
  const navigate = useNavigate()
  const [codes, setCodes] = useState<Code[]>([])
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [newCodes, setNewCodes] = useState('')
  const [adding, setAdding] = useState(false)
  const [message, setMessage] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate('/admin/login')
      return
    }
    loadProduct()
    loadCodes()
  }, [productId])

  async function loadProduct() {
    const res = await fetchAPI(`/api/admin/products/${productId}`)
    setProduct(res.data || null)
  }

  async function loadCodes() {
    const res = await fetchAPI(`/api/admin/products/${productId}/codes`)
    setCodes(res.data || [])
    setLoading(false)
  }

  async function handleAddCodes(e: React.FormEvent) {
    e.preventDefault()
    if (!newCodes.trim()) return

    setAdding(true)
    setMessage('')

    const codeList = newCodes
      .split('\n')
      .map((c) => c.trim())
      .filter((c) => c.length > 0)

    try {
      const res = await fetchAPI(`/api/admin/products/${productId}/codes`, {
        method: 'POST',
        body: JSON.stringify({ codes: codeList }),
      })
      setMessage(`成功添加 ${res.count} 个激活码`)
      setNewCodes('')
      loadCodes()
    } catch (err: any) {
      setMessage('添加失败: ' + err.message)
    } finally {
      setAdding(false)
    }
  }

  // 生成100个随机激活码
  function generateCodes() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    const generated: string[] = []
    for (let i = 0; i < 100; i++) {
      let code = ''
      for (let j = 0; j < 4; j++) {
        if (j > 0) code += '-'
        for (let k = 0; k < 4; k++) {
          code += chars[Math.floor(Math.random() * chars.length)]
        }
      }
      generated.push(code)
    }
    setNewCodes(generated.join('\n'))
  }

  // 复制激活码
  function copyCode(code: string, id: string) {
    navigator.clipboard.writeText(code)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  // 导出未使用的激活码为 CSV
  function exportCodes() {
    const unusedCodes = codes.filter((c) => !c.is_used)
    if (unusedCodes.length === 0) {
      alert('没有未使用的激活码')
      return
    }
    const csv = '激活码,创建时间\n' + unusedCodes.map((c) => `${c.code},${c.created_at}`).join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${product?.name || 'codes'}-激活码.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function deleteCode(codeId: string) {
    if (!confirm('确定删除此激活码？')) return
    await fetchAPI(`/api/admin/codes/${codeId}`, { method: 'DELETE' })
    loadCodes()
  }

  // 排序：未使用的在前面
  const sortedCodes = [...codes].sort((a, b) => {
    if (a.is_used === b.is_used) return 0
    return a.is_used ? 1 : -1
  })

  const unusedCount = codes.filter((c) => !c.is_used).length
  const usedCount = codes.filter((c) => c.is_used).length

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/admin" className="text-gray-500 hover:text-gray-900">←</Link>
          <h1 className="text-lg font-bold">{product?.name || ''} · 激活码管理</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* 统计 */}
        <div className="flex gap-4">
          <div className="bg-white px-4 py-3 rounded-lg border">
            <span className="text-sm text-gray-500">总数: </span>
            <span className="font-bold">{codes.length}</span>
          </div>
          <div className="bg-white px-4 py-3 rounded-lg border">
            <span className="text-sm text-gray-500">未使用: </span>
            <span className="font-bold text-green-600">{unusedCount}</span>
          </div>
          <div className="bg-white px-4 py-3 rounded-lg border">
            <span className="text-sm text-gray-500">已使用: </span>
            <span className="font-bold text-gray-400">{usedCount}</span>
          </div>
          <div className="flex-1" />
          <button
            onClick={exportCodes}
            className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition"
          >
            导出未使用(Excel)
          </button>
        </div>

        {/* 批量添加 */}
        <form onSubmit={handleAddCodes} className="bg-white p-5 rounded-xl border">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium">批量添加激活码</h3>
            <button
              type="button"
              onClick={generateCodes}
              className="px-3 py-1.5 bg-purple-100 text-purple-700 text-xs rounded-lg hover:bg-purple-200 transition"
            >
              一键生成100个
            </button>
          </div>
          <textarea
            value={newCodes}
            onChange={(e) => setNewCodes(e.target.value)}
            rows={5}
            placeholder="每行一个激活码，例如：&#10;ABC123-DEF456&#10;GHI789-JKL012&#10;..."
            className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-purple-300 text-sm font-mono"
          />
          <div className="mt-3 flex items-center gap-3">
            <button
              type="submit"
              disabled={adding}
              className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 disabled:opacity-50"
            >
              {adding ? '添加中...' : '添加'}
            </button>
            {message && <span className="text-sm text-blue-600">{message}</span>}
          </div>
        </form>

        {/* 激活码列表 */}
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="px-4 py-3 border-b bg-gray-50">
            <h3 className="font-medium text-sm">激活码列表</h3>
          </div>
          {loading ? (
            <p className="p-4 text-gray-400 text-sm">加载中...</p>
          ) : sortedCodes.length === 0 ? (
            <p className="p-4 text-gray-400 text-sm">暂无激活码</p>
          ) : (
            <div className="max-h-[500px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b sticky top-0">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium text-gray-600">激活码</th>
                    <th className="text-left px-4 py-2 font-medium text-gray-600">状态</th>
                    <th className="text-left px-4 py-2 font-medium text-gray-600">创建时间</th>
                    <th className="text-right px-4 py-2 font-medium text-gray-600">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedCodes.map((code) => (
                    <tr
                      key={code.id}
                      className={`border-b last:border-0 group ${
                        code.is_used ? 'bg-gray-50/50' : 'hover:bg-purple-50/30'
                      }`}
                    >
                      <td className={`px-4 py-2 font-mono text-xs ${
                        code.is_used ? 'text-gray-300 line-through' : 'text-gray-800'
                      }`}>
                        {code.code}
                      </td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          code.is_used
                            ? 'bg-gray-100 text-gray-400'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {code.is_used ? '已使用' : '未使用'}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-gray-400 text-xs">
                        {new Date(code.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2 text-right space-x-2">
                        {!code.is_used && (
                          <button
                            onClick={() => copyCode(code.code, code.id)}
                            className="text-purple-500 hover:text-purple-700 text-xs opacity-0 group-hover:opacity-100 transition"
                          >
                            {copiedId === code.id ? '已复制 ✓' : '复制'}
                          </button>
                        )}
                        <button
                          onClick={() => deleteCode(code.id)}
                          className="text-red-400 hover:text-red-600 text-xs opacity-0 group-hover:opacity-100 transition"
                        >
                          删除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
