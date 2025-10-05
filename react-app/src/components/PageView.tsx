import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../lib/api'
import Header from './Header'
import PageGrid from './PageGrid'

export default function PageView() {
  const { notebookId } = useParams()
  const navigate = useNavigate()
  const [notebook, setNotebook] = useState<any | null>(null)
  const [currentUser, setCurrentUser] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pageRefreshKey, setPageRefreshKey] = useState(0)
  const [showNewPageInput, setShowNewPageInput] = useState(false)
  const [newPageName, setNewPageName] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    let mounted = true

    async function loadNotebook() {
      if (!notebookId) {
        setError('No notebook ID provided')
        setLoading(false)
        return
      }

      try {
        // Load notebook and current user in parallel
        const [notebookRes, userRes] = await Promise.all([
          api.get(`/api/notebooks/${notebookId}/`, true),
          api.get('/auth/user/', true)
        ])
        
        if (!mounted) return

        // Handle notebook data
        if (notebookRes.ok && notebookRes.body) {
          const nb = {
            notebook_id: notebookRes.body.notebook_id,
            title: notebookRes.body.title,
            admin: notebookRes.body.admin_id ? { id: notebookRes.body.admin_id.id, username: notebookRes.body.admin_id.username } : undefined,
            user_ids: notebookRes.body.user_ids || [],
            created_at: notebookRes.body.created_at,
            updated_at: notebookRes.body.updated_at,
            pages: notebookRes.body.pages || [],
            merge_threshold: notebookRes.body.merge_threshold,
            isPrivate: !(notebookRes.body.user_ids && notebookRes.body.user_ids.length > 0),
            contributors: notebookRes.body.user_ids ? notebookRes.body.user_ids.map((u: any) => u.username) : []
          }
          setNotebook(nb)
        } else {
          setError('Failed to load notebook')
        }

        // Handle user data
        if (userRes.ok && userRes.body) {
          setCurrentUser(userRes.body)
        }
      } catch (e) {
        console.error('Error loading notebook:', e)
        setError('Error loading notebook')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadNotebook()
    return () => { mounted = false }
  }, [notebookId])

  const handleReturn = () => {
    navigate('/')
  }

  const handleAddPage = async () => {
    setShowNewPageInput(true)
  }

  const handleCreatePage = async () => {
    if (!notebook) return
    const title = newPageName.trim() || 'New Page'
    setIsCreating(true)
    try {
      const payload = { title }
      const res = await api.post(`/api/notebooks/${notebook.notebook_id}/pages/`, payload, true)
      if (res.ok) {
        setPageRefreshKey(k => k + 1)
        setNewPageName('')
        setShowNewPageInput(false)
      } else {
        console.error('Failed to create page', res)
      }
    } catch (e) {
      console.error('Error creating page', e)
    } finally {
      setIsCreating(false)
    }
  }

  const handleCancelNewPage = () => {
    setNewPageName('')
    setShowNewPageInput(false)
  }

  const handleThresholdUpdate = () => {
    // Reload notebook to get updated threshold
    setPageRefreshKey(k => k + 1)
    // Re-fetch notebook data
    if (notebookId) {
      api.get(`/api/notebooks/${notebookId}/`, true).then(res => {
        if (res.ok && res.body) {
          setNotebook((prev: any) => ({
            ...prev,
            merge_threshold: res.body.merge_threshold
          }))
        }
      })
    }
  }

  if (loading) {
    return (
      <div className="home-root">
        <Header onNewNotebook={() => {}} siteTitle="Loading..." activeNotebookId={null} onReturn={handleReturn} onAddPage={() => {}} />
        <main className="home-main">
          <div className="panel-wrap">
            <div className="loading">Loading notebook...</div>
          </div>
        </main>
      </div>
    )
  }

  if (error || !notebook) {
    return (
      <div className="home-root">
        <Header onNewNotebook={() => {}} siteTitle="Error" activeNotebookId={null} onReturn={handleReturn} onAddPage={() => {}} />
        <main className="home-main">
          <div className="panel-wrap">
            <div className="error-message">{error || 'Notebook not found'}</div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="home-root">
      {showNewPageInput && (
        <div className="new-notebook-modal">
          <div className="new-notebook-content">
            <h3>Create New Page</h3>
            <input
              placeholder="Enter page name..."
              value={newPageName}
              onChange={(e) => setNewPageName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                  handleCreatePage()
                } else if (e.key === 'Escape') {
                  handleCancelNewPage()
                }
              }}
              autoFocus
              className="new-notebook-textarea"
              disabled={isCreating}
            />
            <div className="new-notebook-actions">
              <button onClick={handleCancelNewPage} className="btn-cancel" disabled={isCreating}>
                Cancel
              </button>
              <button onClick={handleCreatePage} className="btn-create" disabled={isCreating}>
                {isCreating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <Header 
        onNewNotebook={() => {}} 
        siteTitle={notebook.title} 
        activeNotebookId={notebook.notebook_id} 
        onReturn={handleReturn} 
        onAddPage={handleAddPage}
        notebookAdmin={notebook.admin}
        currentUserId={currentUser?.id}
        mergeThreshold={notebook.merge_threshold}
        onThresholdUpdate={handleThresholdUpdate}
      />
      <main className="home-main">
        <div className="panel-wrap">
          <PageGrid notebook={notebook} refreshKey={pageRefreshKey} />
        </div>
      </main>
    </div>
  )
}
