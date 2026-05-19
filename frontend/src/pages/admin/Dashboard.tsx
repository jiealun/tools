import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { fetchAPI, isLoggedIn, logout } from '../../lib/api'

interface Stats {
  totalProducts: number
  totalCodes: number
  usedCodes: number
  totalDownloads: number
}

interface Product {
  id: string
  name: string
  price: number
  category: string
  is_published: boolean
  download_count: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate('/admin/login')
      return
    }
    loadStats()
    loadProducts()
  }, [])

  async function loadStats() {
    const res = await fetchAPI('/api/admin/stats')
    setStats(res)
  }

  async function loadProducts() {
    const res = await fetchAPI('/api/admin/products')
    setProducts(res.data || [])
  }

  const filteredProducts = search
    ? products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    : products

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶栏 */}
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🦄</span>
            <h1 className="text-lg font-bold">彩虹工具箱后台</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/" className="text-sm text-gray-500 hover:text-gray-900">
              查看前台
            </Link>
            <button onClick={logout} className="text-sm text-red-500 hover:text-red-700">
              退出
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* 统计卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-xl border">
            <p className="text-sm text-gray-500">产品总数</p>
            <p className="text-2xl font-bold mt-1">{stats?.totalProducts || 0}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border">
            <p className="text-sm text-gray-500">总下载量</p>
            <p className="text-2xl font-bold mt-1">{stats?.totalDownloads || 0}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border">
            <p className="text-sm text-gray-500">激活码总数</p>
            <p className="text-2xl font-bold mt-1">{stats?.totalCodes || 0}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border">
            <p className="text-sm text-gray-500">已使用</p>
            <p className="text-2xl font-bold mt-1">{stats?.usedCodes || 0}</p>
          </div>
        </div>

        {/* 搜索 + 添加按钮 */}
        <div className="flex items-center justify-between mb-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索产品..."
            className="w-[260px] px-4 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-300"
          />
          <Link
            to="/admin/products/new"
            className="px-4 py-2 bg-[#6b38d4] text-white text-sm rounded-lg hover:bg-[#5a2db8] transition"
          >
            + 添加新产品
          </Link>
        </div>

        {/* 产品列表 */}
        <div className="bg-white rounded-xl border overflow-x-auto">
          {filteredProducts.length === 0 ? (
            <p className="p-6 text-center text-gray-400">暂无产品</p>
          ) : (
            <div className="md:hidden space-y-3 p-4">
              {filteredProducts.map((p) => (
                <div key={p.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{p.name}</span>
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      p.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {p.is_published ? '已发布' : '草稿'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>{p.category}</span>
                    <span className="text-orange-500">¥{p.price}</span>
                    <span>{p.download_count}次下载</span>
                  </div>
                  <div className="flex gap-3 text-xs">
                    <Link to={`/admin/products/${p.id}/codes`} className="text-blue-500">激活码</Link>
                    <Link to={`/admin/products/${p.id}`} className="text-gray-500">编辑</Link>
                  </div>
                </div>
              ))}
            </div>
          )}
          {filteredProducts.length > 0 && (
            <table className="w-full text-sm hidden md:table">
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
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{p.name}</td>
                    <td className="px-4 py-3 text-gray-500">{p.category}</td>
                    <td className="px-4 py-3 text-orange-500">¥{p.price}</td>
                    <td className="px-4 py-3 text-gray-500">{p.download_count}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        p.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {p.is_published ? '已发布' : '草稿'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <Link to={`/admin/products/${p.id}/codes`} className="text-blue-500 hover:underline">激活码</Link>
                      <Link to={`/admin/products/${p.id}`} className="text-gray-500 hover:underline">编辑</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  )
}
