import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../lib/api'
import './PostsGrid.css'

export default function PostsGrid() {
  const { notebookId } = useParams<{ notebookId: string }>()
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [votingPosts, setVotingPosts] = useState<Set<string>>(new Set())
  const [notebook, setNotebook] = useState<any>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [showThresholdPopup, setShowThresholdPopup] = useState(false)
  const [thresholdValue, setThresholdValue] = useState('')
  const [updatingThreshold, setUpdatingThreshold] = useState(false)
  const navigate = useNavigate()

  const handleVote = async (postId: string) => {
    if (votingPosts.has(postId)) return // Prevent double-clicking
    
    setVotingPosts(prev => new Set(prev.add(postId)))
    
    try {
      const post = posts.find(p => p.post_id === postId)
      if (!post) return
      
      const res = await api.patch(`/api/notebooks/${notebookId}/pages/${post.page_id?.page_id}/posts/${postId}/vote/`, {}, true)
      if (res.ok) {
        if (res.body.merged) {
          // Post was merged and deleted - reload the posts list
          await loadPosts()
        } else {
          // Update the vote count for this post
          setPosts(prevPosts => 
            prevPosts.map(p => 
              p.post_id === postId 
                ? { ...p, votes: res.body.votes, voted: !p.voted }
                : p
            )
          )
        }
      } else {
        console.error('Failed to vote:', res)
      }
    } catch (e) {
      console.error('Error voting:', e)
    } finally {
      setVotingPosts(prev => {
        const newSet = new Set(prev)
        newSet.delete(postId)
        return newSet
      })
    }
  }

  const handleUpdateThreshold = async () => {
    if (!notebookId || !isAdmin) return
    
    const newThreshold = parseInt(thresholdValue)
    if (isNaN(newThreshold) || newThreshold < 1) {
      alert('Please enter a valid threshold (minimum 1)')
      return
    }
    
    setUpdatingThreshold(true)
    try {
      const res = await api.patch(`/api/notebooks/${notebookId}/`, {
        merge_threshold: newThreshold
      }, true)
      
      if (res.ok) {
        setNotebook((prev: any) => ({ ...prev, merge_threshold: newThreshold }))
        setShowThresholdPopup(false)
        setThresholdValue('')
      } else {
        alert('Failed to update threshold')
      }
    } catch (e) {
      console.error('Error updating threshold:', e)
      alert('Error updating threshold')
    } finally {
      setUpdatingThreshold(false)
    }
  }

  const loadPosts = async () => {
    setLoading(true)
    setError(null)
    try {
      if (!notebookId) {
        setError('Missing notebook id')
        return
      }
      // fetch pages for notebook
      const pagesRes = await api.get(`/api/notebooks/${notebookId}/pages/`, true)
      if (!pagesRes.ok || !Array.isArray(pagesRes.body)) {
        setError('Failed to load pages')
        return
      }

      const pageList = pagesRes.body
      const allPosts: any[] = []
      // fetch posts per page
      await Promise.all(pageList.map(async (p: any) => {
        try {
          const pres = await api.get(`/api/notebooks/${notebookId}/pages/${p.page_id}/posts/`, true)
          if (pres.ok && Array.isArray(pres.body)) {
            pres.body.forEach((post: any) => {
              allPosts.push({
                ...post,
                pageTitle: p.title
              })
            })
          }
        } catch (e) {
          // ignore per-page failures
        }
      }))

      // sort posts by votes desc, then by created_at desc
      allPosts.sort((a, b) => {
        if (b.votes !== a.votes) return b.votes - a.votes
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })
      setPosts(allPosts)
    } catch (e) {
      setError('Error loading posts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPosts()
    
    // Load notebook details for admin check
    const loadNotebook = async () => {
      if (!notebookId) return
      try {
        const res = await api.get(`/api/notebooks/${notebookId}/`, true)
        if (res.ok) {
          setNotebook({
            ...res.body,
            admin: res.body.admin_id ? { 
              id: res.body.admin_id.id, 
              username: res.body.admin_id.username 
            } : null
          })
        }
      } catch (e) {
        console.error('Error loading notebook:', e)
      }
    }
    
    // Load current user
    const loadCurrentUser = async () => {
      try {
        const res = await api.get('/api/me/', true)
        if (res.ok) {
          setCurrentUser(res.body)
        }
      } catch (e) {
        console.error('Error loading current user:', e)
      }
    }
    
    loadNotebook()
    loadCurrentUser()
  }, [notebookId])
  
  // Check if current user is admin
  const isAdmin = notebook?.admin && currentUser && notebook.admin.id === currentUser.id

  return (
    <>
      <div className="site-title-bar">
        <div className="return-in-title">
          <button className="btn" onClick={() => navigate(`/notebook/${encodeURIComponent(notebookId || '')}`)}>← Return</button>
        </div>
        <h1 className="site-title">Posts</h1>
        <div className="logout-in-title">
          {isAdmin && (
            <button 
              className="btn primary"
              onClick={() => {
                setThresholdValue(notebook.merge_threshold?.toString() || '3')
                setShowThresholdPopup(true)
              }}
              title="Set voting threshold for auto-merging posts"
            >
              Set Merge Threshold ({notebook.merge_threshold || 3})
            </button>
          )}
        </div>
      </div>
      <div className="posts-root">
        {loading && <div className="loading">Loading posts...</div>}
        {error && <div className="error-message">{error}</div>}
        {!loading && !error && posts.length === 0 && (
          <div className="empty-posts">
            <p>There are no current posts. Check back later!</p>
          </div>
        )}
        <div className="posts-grid">
          {posts.map((post) => (
            <div className="post-card" key={post.post_id}>
              <div className="post-card-title">{post.pageTitle || 'Page'}</div>
              <div className="post-card-meta">By {post.user_id?.username || 'Unknown'} • {new Date(post.created_at).toLocaleString()}</div>
              <div className="post-card-actions">
                <div className="vote-section">
                  <button 
                    className={`btn vote-btn ${post.voted ? 'voted' : ''}`}
                    onClick={() => handleVote(post.post_id)}
                    disabled={votingPosts.has(post.post_id)}
                    title={post.voted ? 'Remove vote' : 'Vote for this post'}
                  >
                    {votingPosts.has(post.post_id) ? '...' : '▲'}
                  </button>
                  <span className="vote-count">{post.votes || 0}</span>
                </div>
                <button 
                  className="btn primary" 
                  onClick={() => navigate(`/view/${notebookId}/${post.page_id?.page_id}?post=${post.post_id}`)}
                >
                  View Changes
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Threshold Setting Popup */}
      {showThresholdPopup && (
        <div className="popup-overlay" onClick={() => setShowThresholdPopup(false)}>
          <div className="popup-content" onClick={(e) => e.stopPropagation()}>
            <h3>Set Voting Threshold</h3>
            <p>Posts will automatically merge when they reach this many votes:</p>
            <input
              type="number"
              min="1"
              value={thresholdValue}
              onChange={(e) => setThresholdValue(e.target.value)}
              placeholder="Enter threshold"
              className="threshold-input"
            />
            <div className="popup-actions">
              <button 
                className="btn" 
                onClick={() => setShowThresholdPopup(false)}
                disabled={updatingThreshold}
              >
                Cancel
              </button>
              <button 
                className="btn primary" 
                onClick={handleUpdateThreshold}
                disabled={updatingThreshold}
              >
                {updatingThreshold ? 'Updating...' : 'Update Threshold'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
