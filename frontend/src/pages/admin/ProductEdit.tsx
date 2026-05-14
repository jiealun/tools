import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { fetchAPI, isLoggedIn } from '../../lib/api'
import MarkdownEditor from '../../components/MarkdownEditor'

interface ProductForm {
  name: string
  description: string
  cover_url: string
  screenshots: string[]
  price: number
  category: string
  download_url: string
  ifaka_url: string
  is_published: boolean
}

const defaultForm: ProductForm = {
  name: '',
  description: '',
  cover_url: '',
  screenshots: [],
  price: 9.9,
  category: 'plugin',
  download_url: '',
  ifaka_url: '',
  is_published: false,
}

export default function AdminProductEdit() {
  const { id } = useParams()
  const isNew = !id
  const navigate = useNavigate()
  const [form, setForm] = useState<ProductForm>(defaultForm)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate('/admin/login')
      return
    }
    if (!isNew) {
      loadProduct()
    }
  }, [id])

  async function loadProduct() {
    const res = await fetchAPI(`/api/admin/products/${id}`)
    if (res.data) {
      setForm(res.data)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    try {
      if (isNew) {
        const res = await fetchAPI('/api/admin/products', {
          method: 'POST',
          body: JSON.stringify(form),
        })
        if (res.data) {
          navigate(`/admin/products/${res.data.id}`)
          setMessage('创建成功')
        }
      } else {
        await fetchAPI(`/api/admin/products/${id}`, {
          method: 'PUT',
          body: JSON.stringify(form),
        })
        setMessage('保存成功')
      }
    } catch (err: any) {
      setMessage('保存失败: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !id) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('productId', id)

    try {
      const res = await fetchAPI('/api/upload/file', {
        method: 'POST',
        body: formData,
      })
      if (res.fileKey) {
        setForm({ ...form, download_url: res.fileKey })
        setMessage(`文件上传成功: ${res.fileName}`)
      }
    } catch (err: any) {
      setMessage('上传失败: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetchAPI('/api/upload/cover', {
        method: 'POST',
        body: formData,
      })
      if (res.url) {
        setForm({ ...form, cover_url: res.url })
        setMessage('封面上传成功')
      }
    } catch (err: any) {
      setMessage('上传失败: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/admin/products" className="text-gray-500 hover:text-gray-900">←</Link>
          <h1 className="text-lg font-bold">{isNew ? '添加产品' : '编辑产品'}</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {message && (
          <div className="mb-4 p-3 bg-blue-50 text-blue-700 text-sm rounded-lg">{message}</div>
        )}

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border space-y-5">
          {/* 名称 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">产品名称 *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-gray-900"
              required
            />
          </div>

          {/* 分类 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-gray-900"
            >
              <option value="plugin">浏览器插件</option>
              <option value="figma">Figma插件</option>
              <option value="tutorial">教程文档</option>
              <option value="tool">实用工具</option>
            </select>
          </div>

          {/* 简介 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">产品简介（支持Markdown）</label>
            <MarkdownEditor
              value={form.description}
              onChange={(val) => setForm({ ...form, description: val })}
            />
          </div>

          {/* 价格 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">价格（元）</label>
            <input
              type="number"
              step="0.01"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>

          {/* 封面图 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">封面图</label>
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-purple-400 transition relative"
              onPaste={async (e) => {
                const items = e.clipboardData?.items
                if (!items) return
                for (let i = 0; i < items.length; i++) {
                  if (items[i].type.startsWith('image/')) {
                    e.preventDefault()
                    const file = items[i].getAsFile()
                    if (!file) return
                    setUploading(true)
                    setMessage('')
                    const formData = new FormData()
                    formData.append('file', file)
                    try {
                      const res = await fetchAPI('/api/upload/cover', { method: 'POST', body: formData })
                      if (res.url) {
                        setForm({ ...form, cover_url: res.url })
                        setMessage('封面上传成功')
                      }
                    } catch (err: any) {
                      setMessage('上传失败: ' + err.message)
                    } finally {
                      setUploading(false)
                    }
                    return
                  }
                }
              }}
              tabIndex={0}
            >
              {form.cover_url ? (
                <img src={form.cover_url} alt="封面预览" className="max-h-[160px] mx-auto rounded-lg" />
              ) : (
                <p className="text-sm text-gray-400">点击选择文件，或 Cmd+V 粘贴图片</p>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleCoverUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
                disabled={uploading}
              />
            </div>
            {uploading && <p className="text-xs text-blue-500 mt-1">上传中...</p>}
          </div>

          {/* 工具文件 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              工具文件
            </label>
            {isNew ? (
              <p className="text-sm text-gray-400">请先保存产品，再上传文件</p>
            ) : (
              <input
                type="file"
                onChange={handleFileUpload}
                className="text-sm"
                disabled={uploading}
              />
            )}
            {form.download_url && (
              <p className="text-xs text-green-600 mt-1">✓ 已上传: {form.download_url}</p>
            )}
          </div>

          {/* 发布状态 */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="published"
              checked={form.is_published}
              onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
              className="rounded"
            />
            <label htmlFor="published" className="text-sm text-gray-700">
              发布（勾选后前台可见）
            </label>
          </div>

          {/* 提交 */}
          <div className="pt-4 border-t flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
            >
              {saving ? '保存中...' : '保存'}
            </button>
            <Link
              to="/admin/products"
              className="px-6 py-2.5 border rounded-lg text-gray-600 hover:bg-gray-50"
            >
              取消
            </Link>
          </div>
        </form>
      </main>
    </div>
  )
}
