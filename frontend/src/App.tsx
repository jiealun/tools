import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import ProductDetail from './pages/ProductDetail'
import AdminLogin from './pages/admin/Login'
import AdminDashboard from './pages/admin/Dashboard'
import AdminProducts from './pages/admin/Products'
import AdminProductEdit from './pages/admin/ProductEdit'
import AdminCodes from './pages/admin/Codes'

export default function App() {
  return (
    <Routes>
      {/* 前台 */}
      <Route path="/" element={<Home />} />
      <Route path="/product/:id" element={<ProductDetail />} />

      {/* 后台 */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/admin/products" element={<AdminProducts />} />
      <Route path="/admin/products/new" element={<AdminProductEdit />} />
      <Route path="/admin/products/:id" element={<AdminProductEdit />} />
      <Route path="/admin/products/:id/codes" element={<AdminCodes />} />
    </Routes>
  )
}
