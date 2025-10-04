import { useEffect, useState } from 'react'
import type { PropsWithChildren } from 'react'
import api from '../lib/api'

export default function AuthGuard({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<'loading' | 'ok' | 'unauth'>('loading')

  useEffect(() => {
    let mounted = true
    async function check() {
      const res = await api.get('/auth/users/me/', true)
      if (!mounted) return
      if (res.ok) setStatus('ok')
      else {
        localStorage.removeItem('authToken')
        setStatus('unauth')
        window.location.href = '/login'
      }
    }
    check()
    return () => { mounted = false }
  }, [])

  if (status === 'loading') {
    return <div style={{padding:20}}>Checking authentication...</div>
  }

  return <>{children}</>
}
