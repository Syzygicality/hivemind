import { useEffect, useState } from 'react'
import api from '../lib/api'
import './PageGrid.css'

export default function PageGrid({ notebook, onBack }: { notebook: any, onBack: () => void }) {
  const [pages, setPages] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    async function loadPages() {
      setLoading(true)
      setError(null)
      try {
        const res = await api.get(`/api/notebooks/${notebook.notebook_id}/pages/`, true)
        if (!mounted) return
        if (res.ok && Array.isArray(res.body)) {
          setPages(res.body)
        } else {
          setError('Failed to load pages')
        }
      } catch (err) {
        setError('Error loading pages')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    loadPages()
    return () => { mounted = false }
  }, [notebook])

  return (
    <div className="page-grid-root">
      <div className="page-grid-header">
        <button className="back-button" onClick={onBack}>← Back to Notebooks</button>
        <h2 className="page-grid-title">{notebook.title}</h2>
      </div>

      {error && <div className="error-message">{error}</div>}
      {loading && <div className="loading">Loading pages...</div>}

      <div className="page-grid">
        {pages.map((p: any) => (
          <div className="page-card" key={p.page_id}>
            <div className="page-card-title">{p.title || 'Untitled Page'}</div>
            <div className="page-card-meta">{p.latest_version?.created_at ? new Date(p.latest_version.created_at).toLocaleString() : ''}</div>
            <div className="page-card-snippet">{p.latest_version?.content ? p.latest_version.content.slice(0, 160) : 'No content yet.'}</div>
            <div className="page-card-actions">
              <button className="btn primary">Open</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
