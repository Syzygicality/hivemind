import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import './PageGrid.css'
import PageEditor from './PageEditor'

export default function PageGrid({ notebook, refreshKey }: { notebook: any, refreshKey?: number }) {
  const navigate = useNavigate()
  const [pages, setPages] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingPage, setEditingPage] = useState<any | null>(null)
  const [draftsByPage, setDraftsByPage] = useState<Record<string, any>>({})

  const formatShortTime = (iso?: string) => {
    if (!iso) return ''
    const d = new Date(iso)
    const now = new Date()
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000) // seconds
    if (diff < 60) return 'just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`
    const days = Math.floor(diff / 86400)
    if (days < 7) return `${days}d`
    // otherwise show short date
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  }

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
          // also fetch drafts (to show draft metadata like last-updated)
          try {
            const dres = await api.get(`/api/notebooks/${notebook.notebook_id}/drafts/`, true)
            if (dres.ok && Array.isArray(dres.body)) {
              const map: Record<string, any> = {}
              dres.body.forEach((d: any) => {
                if (d.page_id && d.page_id.page_id) map[d.page_id.page_id] = d
              })
              setDraftsByPage(map)
            } else {
              setDraftsByPage({})
            }
          } catch (err) {
            setDraftsByPage({})
          }
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
              {/* stacked info column: last-modified above version */}
              {p.latest_version && (
                <div className="page-card-info">
                  <div className="page-card-lastmodified">
                    {(() => {
                      const draft = draftsByPage[p.page_id]
                      const timeIso = draft ? draft.updated_at : p.latest_version?.created_at
                      const t = timeIso ? formatShortTime(timeIso) : ''
                      return t ? `Last Modified: ${t} ago` : ''
                    })()}
                  </div>
                </div>
              )}
              {/* draft meta moved to top near version */}
              <div className="page-card-actions">
                <button className="btn primary" onClick={() => navigate(`/view/${notebook.notebook_id}/${p.page_id}`)}>View</button>
                <button className="btn primary" onClick={async () => {
                  try {
                    // check for existing drafts for this notebook
                    const draftsRes = await api.get(`/api/notebooks/${notebook.notebook_id}/drafts/`, true)
                    if (draftsRes.ok && Array.isArray(draftsRes.body)) {
                      const existing = draftsRes.body.find((d: any) => d.page_id?.page_id === p.page_id)
                      if (existing) {
                        // open editor with existing draft
                        setEditingPage({ ...p, draft_id: existing.draft_id, draft_content: existing.content || '' })
                        return
                      }
                    }

                    // no existing draft: create one
                    const createRes = await api.post(`/api/notebooks/${notebook.notebook_id}/drafts/`, { page_id: p.page_id }, true)
                    if (createRes.ok && createRes.body) {
                      const draft = createRes.body
                      const draftId = draft.draft_id
                      const starting = p.latest_version?.content || ''
                      // initialize draft content
                      await api.patch(`/api/notebooks/${notebook.notebook_id}/drafts/${draftId}`, { content: starting }, true)
                      setEditingPage({ ...p, draft_id: draftId, draft_content: starting })
                    } else {
                      console.error('Failed to create draft', createRes)
                    }
                  } catch (e) {
                    console.error('Error creating/opening draft', e)
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
              pageId={editingPage.page_id}
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
