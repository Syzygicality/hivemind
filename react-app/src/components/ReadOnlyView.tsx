import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../lib/api'
import './ReadOnlyView.css'

export default function ReadOnlyView() {
  const { notebookId, pageId } = useParams<{ notebookId: string, pageId: string }>()
  const navigate = useNavigate()
  const [content, setContent] = useState<string>('')
  const [title, setTitle] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      setError(null)
      try {
        if (!notebookId || !pageId) {
          setError('Missing notebook or page id')
          return
        }
        const res = await api.get(`/api/notebooks/${notebookId}/pages/${pageId}/`, true)
        if (!mounted) return
        if (res.ok && res.body) {
          setTitle(res.body.title || 'Untitled')
          // latest_version may be nested
          const latest = res.body.latest_version || res.body.latest || null
          setContent((latest && latest.content) || '')
        } else {
          setError('Failed to load page')
        }
      } catch (e) {
        setError('Error loading page')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [notebookId, pageId])

  return (
    <div className="readonly-root">
      <div className="readonly-header">
        <button className="btn" onClick={() => navigate(`/?open=${encodeURIComponent(notebookId || '')}`)}>Back</button>
        <h2 className="readonly-title">{title}</h2>
      </div>
      {loading ? (
        <div className="readonly-loading">Loading page...</div>
      ) : error ? (
        <div className="readonly-error">{error}</div>
      ) : (
        <div className="readonly-document">
          <pre className="readonly-pre">{content}</pre>
        </div>
      )}
    </div>
  )
}
