// Default to the Django dev server if no VITE_API_BASE is provided
const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000'

function getToken() {
  return localStorage.getItem('authToken')
}

async function request(path: string, opts: RequestInit = {}) {
  const url = `${API_BASE}${path}`
  try {
    const res = await fetch(url, { credentials: 'include', ...opts })
    const text = await res.text()
    let body = null
    try { body = text ? JSON.parse(text) : null } catch { body = text }
    return { ok: res.ok, status: res.status, body }
  } catch (err: any) {
    // Network or CORS errors surface here; return a shaped error for the UI
    return { ok: false, status: 0, body: { detail: err?.message || 'Network error' } }
  }
}

export async function get(path: string, withAuth = false) {
  const headers: Record<string,string> = { 'Accept': 'application/json' }
  if (withAuth) {
    const t = getToken()
    if (t) headers['Authorization'] = `Token ${t}`
  }
  return request(path, { method: 'GET', headers })
}

export async function post(path: string, data?: any, withAuth = false) {
  const headers: Record<string,string> = { 'Content-Type': 'application/json', 'Accept': 'application/json' }
  if (withAuth) {
    const t = getToken()
    if (t) headers['Authorization'] = `Token ${t}`
  }
  return request(path, { method: 'POST', headers, body: data ? JSON.stringify(data) : undefined })
}

export async function del(path: string, withAuth = false) {
  const headers: Record<string,string> = { 'Accept': 'application/json' }
  if (withAuth) {
    const t = getToken()
    if (t) headers['Authorization'] = `Token ${t}`
  }
  return request(path, { method: 'DELETE', headers })
}

export { getToken }

export default { get, post, del, getToken }
