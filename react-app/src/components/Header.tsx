import api from '../lib/api'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

interface HeaderProps {
  onNewNotebook: () => void
  siteTitle?: string | null
  activeNotebookId?: string | null
  onReturn?: () => void
  onAddPage?: () => void
  notebookAdmin?: { id: string, username: string } | null
  currentUserId?: string | null
  mergeThreshold?: number | null
  onThresholdUpdate?: () => void
}

export default function Header({ onNewNotebook, siteTitle, activeNotebookId, onReturn, onAddPage, notebookAdmin, currentUserId, mergeThreshold, onThresholdUpdate }: HeaderProps) {
  const navigate = useNavigate()
  const [showThresholdInput, setShowThresholdInput] = useState(false)
  const [newThreshold, setNewThreshold] = useState(mergeThreshold || 1)
  const [updating, setUpdating] = useState(false)

  const isAdmin = notebookAdmin && currentUserId && notebookAdmin.id === currentUserId

  const handleUpdateThreshold = async () => {
    if (!activeNotebookId || !isAdmin) return
    
    setUpdating(true)
    try {
      const res = await api.patch(`/api/notebooks/${activeNotebookId}/`, { merge_threshold: newThreshold }, true)
      if (res.ok) {
        setShowThresholdInput(false)
        if (onThresholdUpdate) onThresholdUpdate()
      } else {
        console.error('Failed to update threshold')
      }
    } catch (e) {
      console.error('Error updating threshold:', e)
    } finally {
      setUpdating(false)
    }
  }
  const handleLogout = async () => {
    try {
      await api.post('/auth/token/logout/', undefined, true)
    } catch (e) {
      // ignore
    }
    localStorage.removeItem('authToken')
    window.location.href = '/login'
  }

  return (
    <>
      <div className="site-title-bar">
        {siteTitle ? (
          <div className="return-in-title">
            <button className="btn" onClick={() => { if (onReturn) onReturn(); else window.location.href = '/' }}>← Return to Notebooks</button>
          </div>
        ) : null}
        <h1 className="site-title">{siteTitle ? siteTitle : 'My Hivemind'}</h1>
        <div className="logout-in-title">
          {siteTitle && (
            <button className="btn primary" onClick={() => { navigate(`/posts/${encodeURIComponent((activeNotebookId || '').toString())}`) }}>Posts</button>
          )}
          <button className="btn" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <header className="site-header">
        <div className="header-actions">
          {siteTitle ? (
            <>
              <button style={{ display: isAdmin ? 'none' : 'block' }} className="btn primary" onClick={() => { if (onAddPage) onAddPage() }}>Add Page</button>
              {isAdmin && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '16px' }}>
                  {!showThresholdInput ? (
                    <>
                      <span style={{ fontSize: '0.9em', color: '#666' }}>
                        Merge Threshold: {mergeThreshold || 'Not set'}
                      </span>
                      <button 
                        className="btn" 
                        onClick={() => setShowThresholdInput(true)}
                        style={{ fontSize: '0.8em', padding: '4px 8px' }}
                      >
                        Edit
                      </button>
                    </>
                  ) : (
                    <>
                      <input
                        type="number"
                        min="1"
                        value={newThreshold}
                        onChange={(e) => setNewThreshold(parseInt(e.target.value) || 1)}
                        style={{ width: '60px', padding: '4px' }}
                        disabled={updating}
                      />
                      <button 
                        className="btn primary" 
                        onClick={handleUpdateThreshold}
                        disabled={updating}
                        style={{ fontSize: '0.8em', padding: '4px 8px' }}
                      >
                        {updating ? 'Saving...' : 'Save'}
                      </button>
                      <button 
                        className="btn" 
                        onClick={() => {
                          setShowThresholdInput(false)
                          setNewThreshold(mergeThreshold || 1)
                        }}
                        disabled={updating}
                        style={{ fontSize: '0.8em', padding: '4px 8px' }}
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              )}
            </>
          ) : (
            <button className="btn primary" onClick={onNewNotebook}>Create Notebook</button>
          )}
        </div>
      </header>
    </>
  )
}
