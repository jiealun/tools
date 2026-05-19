import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { fetchAPI, isLoggedIn } from '../../lib/api'

interface Product {
  id: string
  name: string
  price: number
  category: string
  is_published: boolean
  download_count: number
  created_at: string
}

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate('/admin/login')
      return
    }
    loadProducts()
  }, [])

  async function loadProducts() {
    const res = await fetchAPI('/api/admin/products')
    setProducts(res.data || [])
    setLoading(false)
  }

  async function deleteProduct(id: string, name: string) {
    if (!confirm(`确定删除「${name}」？`)) return
    await fetchAPI(`/api/admin/products/${id}`, { method: 'DELETE' })
    loadProducts()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/admin" className="text-gray-500 hover:text-gray-900">←</Link>
            <h1 className="text-lg font-bold">产品管理</h1>
          </div>
          <Link
            to="/admin/products/new"
            className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800"
          >
            + 添加产品
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {loading ? (
          <p className="text-center text-gray-400 py-10">加载中...</p>
        ) : products.length === 0 ? (
          <p className="text-center text-gray-400 py-10">暂无产品</p>
        ) : (
          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">名称</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">分类</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">价格</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">下载量</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">状态</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">操作</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{p.name}</td>
                    <td className="px-4 py-3 text-gray-500">{p.category}</td>
                    <td className="px-4 py-3 text-orange-500">¥{p.price}</td>
                    <td className="px-4 py-3 text-gray-500">{p.download_count}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        p.is_published
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {p.is_published ? '已发布' : '草稿'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <Link
                        to={`/admin/products/${p.id}`}
                        className="text-gray-500 hover:underline"
                      >
                        编辑
                      </Link>
                      <button
                        onClick={() => deleteProduct(p.id, p.name)}
                        className="text-red-500 hover:underline"
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
      </main>
    </div>
  )
}
