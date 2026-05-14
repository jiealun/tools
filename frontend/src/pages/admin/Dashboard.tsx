import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { fetchAPI, isLoggedIn, logout } from '../../lib/api'

interface Stats {
  totalProducts: number
  totalCodes: number
  usedCodes: number
  totalDownloads: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate('/admin/login')
      return
    }
    loadStats()
  }, [])

  async function loadStats() {
    const res = await fetchAPI('/api/admin/stats')
    setStats(res)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶栏 */}
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-lg font-bold">📊 管理后台</h1>
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

        {/* 快捷操作 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            to="/admin/products"
            className="bg-white p-6 rounded-xl border hover:shadow-md transition"
          >
            <h3 className="font-semibold text-lg mb-2">📦 产品管理</h3>
            <p className="text-sm text-gray-500">管理工具和教程，上传文件，设置价格</p>
          </Link>
          <Link
            to="/admin/products/new"
            className="bg-white p-6 rounded-xl border hover:shadow-md transition"
          >
            <h3 className="font-semibold text-lg mb-2">➕ 添加新产品</h3>
            <p className="text-sm text-gray-500">上传新的工具或教程</p>
          </Link>
        </div>
      </main>
    </div>
  )
}
