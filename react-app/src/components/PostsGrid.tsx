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
  }, [notebookId])

  return (
    <>
      <div className="site-title-bar">
        <div className="return-in-title">
          <button className="btn" onClick={() => navigate(`/notebook/${encodeURIComponent(notebookId || '')}`)}>← Return</button>
        </div>
        <h1 className="site-title">Posts</h1>
        <div className="logout-in-title" />
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
              <div className="post-card-content">
                {post.content?.slice(0, 240) || ''}
              </div>
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
    </>
  )
}
