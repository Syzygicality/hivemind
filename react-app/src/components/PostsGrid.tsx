import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../lib/api'
import './PostsGrid.css'

export default function PostsGrid() {
  const { notebookId } = useParams<{ notebookId: string }>()
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      setError(null)
      try {
        if (!notebookId) {
          setError('Missing notebook id')
          return
        }
        // fetch pages for notebook
        const pagesRes = await api.get(`/api/notebooks/${notebookId}/pages/`, true)
        if (!mounted) return
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
              pres.body.forEach((post: any) => allPosts.push({ ...post, pageTitle: p.title }))
            }
          } catch (e) {
            // ignore per-page failures
          }
        }))

        if (mounted) {
          // sort posts by created_at desc
          allPosts.sort((a, b) => (new Date(b.created_at).getTime() - new Date(a.created_at).getTime()))
          setPosts(allPosts)
        }
      } catch (e) {
        if (mounted) setError('Error loading posts')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
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
        <div className="posts-grid">
          {posts.map((post) => (
            <div className="post-card" key={post.post_id}>
              <div className="post-card-title">{post.pageTitle || 'Page'}</div>
              <div className="post-card-meta">By {post.user_id?.username || 'Unknown'} • {new Date(post.created_at).toLocaleString()}</div>
              <div className="post-card-content">{post.content?.slice(0, 240)}</div>
              <div className="post-card-actions">
                {/* future: view post detail */}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
