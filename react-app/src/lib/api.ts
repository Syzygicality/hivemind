const API_BASE = import.meta.env.VITE_API_BASE || ''

function getToken() {
  return localStorage.getItem('authToken')
}

async function request(path: string, opts: RequestInit = {}) {
  const url = `${API_BASE}${path}`
  const res = await fetch(url, { credentials: 'include', ...opts })
  const text = await res.text()
  let body = null
  try { body = text ? JSON.parse(text) : null } catch { body = text }
  return { ok: res.ok, status: res.status, body }
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

export { getToken }

export default { get, post, getToken }
