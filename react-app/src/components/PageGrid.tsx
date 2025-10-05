import { useEffect, useState } from 'react'
import api from '../lib/api'
import './PageGrid.css'
import PageEditor from './PageEditor'

export default function PageGrid({ notebook, refreshKey }: { notebook: any, refreshKey?: number }) {
  const [pages, setPages] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingPage, setEditingPage] = useState<any | null>(null)

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
  }, [notebook, refreshKey])

  return (
    <div className="page-grid-root">
      <div className="page-grid-header">
        {/* Title shown in the global header now; remove local title to avoid duplication */}
      </div>

      {error && <div className="error-message">{error}</div>}
      {loading && <div className="loading">Loading pages...</div>}

      {(!loading && pages.length === 0) ? (
        <div className="empty-pages">
          <p>There are no pages added.</p>
        </div>
      ) : (
        <div className="page-grid">
          {pages.map((p: any) => (
            <div className="page-card" key={p.page_id}>
              <div className="page-card-title">{p.title || 'Untitled Page'}</div>
              <div className="page-card-meta">{p.latest_version?.created_at ? new Date(p.latest_version.created_at).toLocaleString() : ''}</div>
              <div className="page-card-snippet">{p.latest_version?.content ? p.latest_version.content.slice(0, 160) : 'No content yet.'}</div>
              <div className="page-card-actions">
                <button className="btn primary">History</button>
                <button className="btn primary" onClick={async () => {
                  // create a new draft for this page, then open editor
                  try {
                    const createRes = await api.post(`/api/notebooks/${notebook.notebook_id}/drafts/`, { page_id: p.page_id }, true)
                    if (createRes.ok && createRes.body) {
                      const draft = createRes.body
                      // set editingPage to include draft id and initial content
                      setEditingPage({ ...p, draft_id: draft.draft_id, draft_content: draft.content || '' })
                    } else {
                      console.error('Failed to create draft', createRes)
                    }
                  } catch (e) {
                    console.error('Error creating draft', e)
                  }
                }}>Contribute</button>
              </div>
            </div>
          ))}
        </div>
      )}
        {editingPage && (
          <PageEditor
            notebookId={notebook.notebook_id}
              draftId={editingPage.draft_id}
              initialContent={editingPage.draft_content || editingPage.latest_version?.content || ''}
            onClose={() => setEditingPage(null)}
            onSaved={async () => {
              // refresh pages list after saving
              try {
                const res = await api.get(`/api/notebooks/${notebook.notebook_id}/pages/`, true)
                if (res.ok && Array.isArray(res.body)) setPages(res.body)
              } catch (e) {
                // ignore
              }
            }}
          />
        )}
    </div>
  )
}

// Page editor is rendered inline when editingPage is set
