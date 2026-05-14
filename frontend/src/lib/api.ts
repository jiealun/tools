const API_BASE = import.meta.env.VITE_API_URL || ''

export async function fetchAPI(path: string, options?: RequestInit) {
  const token = localStorage.getItem('admin_token')
  const headers: Record<string, string> = {
    ...(options?.headers as Record<string, string>),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  // 如果不是 FormData，设置 Content-Type
  if (options?.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  })

  if (res.status === 401) {
    localStorage.removeItem('admin_token')
    if (window.location.pathname.startsWith('/admin')) {
      window.location.href = '/admin/login'
    }
    throw new Error('未授权')
  }

  return res.json()
}

export function isLoggedIn() {
  return !!localStorage.getItem('admin_token')
}

export function logout() {
  localStorage.removeItem('admin_token')
  window.location.href = '/admin/login'
}
