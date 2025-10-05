import { useState, forwardRef, useImperativeHandle, useEffect } from 'react'
import './NotebookList.css'
import api from '../lib/api'
import NotebookItem from './NotebookItem'
import PageGrid from './PageGrid'

type NotebookListProps = {
  onActiveNotebookChange?: (title: string | null) => void
}

const NotebookList = forwardRef<{ showNewNotebookInput: () => void, closePageView?: () => void, addPage?: () => Promise<void> }, NotebookListProps>((props, ref) => {
  const { onActiveNotebookChange } = props
  const [notebooks, setNotebooks] = useState<any[]>([])
  const [showNewNotebookInput, setShowNewNotebookInput] = useState(false)
  const [newNotebookName, setNewNotebookName] = useState('')
  const [showContributorsStep, setShowContributorsStep] = useState(false)
  // ...existing state
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedContributors, setSelectedContributors] = useState<string[]>([])
  const [showNotebookPage, setShowNotebookPage] = useState(false)
  const [currentNotebook, setCurrentNotebook] = useState<any>(null)
  const [pageRefreshKey, setPageRefreshKey] = useState(0)
  const [showNewPageInput, setShowNewPageInput] = useState(false)
  const [newPageName, setNewPageName] = useState('')
  // notebook editor content removed in favor of PageGrid
  const [allUsers, setAllUsers] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useImperativeHandle(ref, () => ({
    showNewNotebookInput: () => setShowNewNotebookInput(true),
    closePageView: () => { setShowNotebookPage(false); setCurrentNotebook(null); if (onActiveNotebookChange) onActiveNotebookChange(null) },
    addPage: async () => {
      // open the new page name modal
      if (!currentNotebook) return
      setShowNewPageInput(true)
    }
  }))

  const handleCreatePage = async () => {
    if (!currentNotebook) return
    const title = newPageName.trim() || 'New Page'
    setIsLoading(true)
    try {
      const payload = { title }
      const res = await api.post(`/api/notebooks/${currentNotebook.notebook_id}/pages/`, payload, true)
      if (res.ok) {
        setPageRefreshKey(k => k + 1)
        // close modal and reset
        setNewPageName('')
        setShowNewPageInput(false)
        // ensure notebook reference updates
        setCurrentNotebook((prev: any) => (prev ? { ...prev } : prev))
      } else {
        console.error('Failed to create page', res)
      }
    } catch (e) {
      console.error('Error creating page', e)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelNewPage = () => {
    setNewPageName('')
    setShowNewPageInput(false)
  }

  // Load notebooks from API
  useEffect(() => {
    let mounted = true
    async function loadNotebooks() {
      setIsLoading(true)
      setError(null)
      try {
        const res = await api.get('/api/notebooks/', true)
        if (!mounted) return
        
        if (res.ok && Array.isArray(res.body)) {
          const mapped = res.body.map((n: any) => ({
            notebook_id: n.notebook_id,
            title: n.title,
            admin: n.admin_id ? { 
              id: n.admin_id.id, 
              username: n.admin_id.username 
            } : undefined,
            user_ids: n.user_ids || [],
            created_at: n.created_at,
            updated_at: n.updated_at,
            pages: n.pages || [],
            isPrivate: !(n.user_ids && n.user_ids.length > 0),
            contributors: n.user_ids 
              ? n.user_ids
                  .filter((u: any) => u.id !== n.admin_id?.id)
                  .map((u: any) => u.username)
              : []
          }))
          setNotebooks(mapped)
        } else {
          setError('Failed to load notebooks')
          console.error('Failed to load notebooks', res)
        }
      } catch (err) {
        if (mounted) {
          setError('Error loading notebooks')
          console.error('Error loading notebooks:', err)
        }
      } finally {
        if (mounted) setIsLoading(false)
      }
    }
    loadNotebooks()
    // also fetch current user so we can determine admin privileges
    ;(async () => {
      try {
        const r = await api.get('/auth/users/me/', true)
        if (mounted && r.ok) setCurrentUser(r.body)
      } catch (e) {
        // ignore
      }
    })()
    return () => { mounted = false }
  }, [])

  // Load users for contributor selection
  useEffect(() => {
    let mounted = true
    async function loadUsers() {
      try {
        const res = await api.get('/api/users/', true)
        if (!mounted) return
        
        if (res.ok && Array.isArray(res.body)) {
          setAllUsers(res.body)
        } else {
          console.error('Failed to load users', res)
        }
      } catch (err) {
        console.error('Error loading users:', err)
      }
    }
    
    // Only load users when we need them (contributor step)
    if (showContributorsStep && allUsers.length === 0) {
      loadUsers()
    }
    return () => { mounted = false }
  }, [showContributorsStep])

  const handleNameSubmit = () => {
    if (newNotebookName.trim()) {
      // skip privacy step; go straight to contributors
      setShowContributorsStep(true)
    }
  }

  const handleContributorToggle = (userId: string) => {
    setSelectedContributors(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const filteredUsers = searchQuery.trim() 
    ? allUsers
        .filter(user => user.id !== currentUser?.id)
        .filter(user => 
          user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchQuery.toLowerCase())
        )
    : []

  const handleNotebookClick = (notebook: any) => {
    // open notebook page for collaborative notebooks as well
    setCurrentNotebook(notebook)
    setShowNotebookPage(true)
    if (onActiveNotebookChange) onActiveNotebookChange(notebook.title)
  }

  

  // Notify parent when PageGrid closes
  useEffect(() => {
    if (!showNotebookPage && onActiveNotebookChange) {
      onActiveNotebookChange(null)
    }
  }, [showNotebookPage, onActiveNotebookChange])

  const handleCreateNotebook = async () => {
    if (!newNotebookName.trim()) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      // Prepare the payload - user_ids should be an array of user IDs
      const payload: any = {
        title: newNotebookName.trim(),
      }
      
      // always include selected contributors (we only support collaborative notebooks)
      if (selectedContributors.length > 0) {
        payload.user_ids = selectedContributors
      }
      
      // create the notebook first
      const res = await api.post('/api/notebooks/', payload, true)
      
      if (res.ok && res.body) {
        const created = res.body

        // if there are contributors, send a patch to add them
        if (selectedContributors.length > 0) {
          const patchRes = await api.patch(`/api/notebooks/${created.notebook_id}/`, { add_user_ids: selectedContributors }, true)
          if (!patchRes.ok) {
            setError(patchRes.body?.detail || 'Failed to add contributors')
            console.error('Failed to add contributors', patchRes)
          }
        }

        // fetch the notebook detail to get the updated user list (or reuse created if backend returns it)
        const detailRes = await api.get(`/api/notebooks/${created.notebook_id}/`, true)
        const nbData = detailRes.ok ? detailRes.body : created

        // Map the response to UI format
        const newNotebook = {
          notebook_id: nbData.notebook_id,
          title: nbData.title,
          admin: nbData.admin_id ? {
            id: nbData.admin_id.id,
            username: nbData.admin_id.username
          } : undefined,
          user_ids: nbData.user_ids || [],
          created_at: nbData.created_at,
          updated_at: nbData.updated_at,
          pages: nbData.pages || [],
          isPrivate: !(nbData.user_ids && nbData.user_ids.length > 0),
          contributors: nbData.user_ids
            ? nbData.user_ids
                .filter((u: any) => u.id !== nbData.admin_id?.id)
                .map((u: any) => u.username)
            : []
        }

        // Add to notebooks list
        setNotebooks(prev => [...prev, newNotebook])
        
  // Reset form
        setNewNotebookName('')
        setShowNewNotebookInput(false)
  setShowContributorsStep(false)
        setSelectedContributors([])
        setSearchQuery('')
      } else {
        setError(res.body?.detail || 'Failed to create notebook')
        console.error('Failed to create notebook', res)
      }
    } catch (err) {
      setError('Error creating notebook')
      console.error('Error creating notebook:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setNewNotebookName('')
    setShowNewNotebookInput(false)
    setShowContributorsStep(false)
    setSelectedContributors([])
    setSearchQuery('')
    setError(null)
  }

  if (showNotebookPage && currentNotebook) {
    return (
      <>
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
                disabled={isLoading}
              />
              <div className="new-notebook-actions">
                <button onClick={handleCancelNewPage} className="btn-cancel" disabled={isLoading}>
                  Cancel
                </button>
                <button onClick={handleCreatePage} className="btn-create" disabled={isLoading}>
                  {isLoading ? 'Creating...' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        )}

        <PageGrid notebook={currentNotebook} refreshKey={pageRefreshKey} />
      </>
    )
  }

  return (
    <div className="notebook-list-simple">
      {error && (
        <div className="error-message" style={{
          padding: '12px',
          margin: '12px 0',
          backgroundColor: '#fee',
          border: '1px solid #fcc',
          borderRadius: '4px',
          color: '#c33'
        }}>
          {error}
        </div>
      )}

      {showNewNotebookInput && (
        <div className="new-notebook-modal">
          <div className="new-notebook-content">
            {!showContributorsStep ? (
              <>
                <h3>Create New Notebook</h3>
                <textarea
                  placeholder="Enter notebook name..."
                  value={newNotebookName}
                  onChange={(e) => setNewNotebookName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.ctrlKey) {
                      handleNameSubmit()
                    } else if (e.key === 'Escape') {
                      handleCancel()
                    }
                  }}
                  autoFocus
                  className="new-notebook-textarea"
                  rows={4}
                  disabled={isLoading}
                />
                <div className="new-notebook-actions">
                  <button onClick={handleCancel} className="btn-cancel" disabled={isLoading}>
                    Cancel
                  </button>
                  <button onClick={handleNameSubmit} className="btn-create" disabled={isLoading}>
                    Next
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3>Add Contributors</h3>
                <p>Search and select people to invite to this notebook</p>
                <div className="contributor-search">
                  <input
                    type="text"
                    placeholder="Search for people..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="contributor-search-input"
                    autoFocus
                    disabled={isLoading}
                  />
                </div>
                <div className="contributor-list">
                  {filteredUsers.map((user) => (
                    <label key={user.id} className="contributor-option">
                      <input
                        type="checkbox"
                        checked={selectedContributors.includes(user.id)}
                        onChange={() => handleContributorToggle(user.id)}
                        disabled={isLoading}
                      />
                      <span className="contributor-name">
                        {user.username}
                        {user.email && <small style={{ marginLeft: '8px', color: '#666' }}>
                          ({user.email})
                        </small>}
                      </span>
                    </label>
                  ))}
                  {searchQuery && filteredUsers.length === 0 && (
                    <div style={{ padding: '12px', color: '#666', textAlign: 'center' }}>
                      No users found
                    </div>
                  )}
                </div>
                {selectedContributors.length > 0 && (
                  <div className="selected-contributors">
                    <strong>Selected: </strong>
                    {selectedContributors
                      .map(id => allUsers.find(u => u.id === id)?.username)
                      .filter(Boolean)
                      .join(', ')}
                  </div>
                )}
                <div className="new-notebook-actions">
                  <button 
                    onClick={() => setShowContributorsStep(false)} 
                    className="btn-cancel"
                    disabled={isLoading}
                  >
                    Back
                  </button>
                  <button 
                    onClick={handleCreateNotebook} 
                    className="btn-create"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Creating...' : 'Create'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      
      {isLoading && notebooks.length === 0 ? (
        <div style={{ padding: '24px', textAlign: 'center', color: '#666' }}>
          Loading notebooks...
        </div>
      ) : (
        <ul className="notebook-list">
          {notebooks.map((notebook) => (
            <li key={notebook.notebook_id} onClick={() => handleNotebookClick(notebook)}>
              <NotebookItem
                notebook={notebook}
                currentUser={currentUser}
                onDelete={async (id: string) => {
                  // optimistic update: remove locally then attempt delete
                  if (!confirm('Delete this notebook? This cannot be undone.')) return
                  try {
                    const res = await api.del(`/api/notebooks/${id}/`, true)
                    if (res.ok) {
                      setNotebooks(prev => prev.filter(n => n.notebook_id !== id))
                    } else {
                      setError(res.body?.detail || 'Failed to delete notebook')
                    }
                  } catch (err) {
                    setError('Error deleting notebook')
                  }
                }}
              />
            </li>
          ))}
          {notebooks.length === 0 && !isLoading && (
            <div style={{ padding: '24px', textAlign: 'center', color: '#666' }}>
              No notebooks yet. Create your first notebook!
            </div>
          )}
        </ul>
      )}
    </div>
  )
})

export default NotebookList