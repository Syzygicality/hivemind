import { useEffect, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import api from '../lib/api'
import './ReadOnlyView.css'

export default function ReadOnlyView() {
  const { notebookId, pageId } = useParams<{ notebookId: string, pageId: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const postId = searchParams.get('post')
  
  const [content, setContent] = useState<string>('')
  const [postContent, setPostContent] = useState<string>('')
  const [currentPost, setCurrentPost] = useState<any | null>(null)
  const [title, setTitle] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [isViewingPost, setIsViewingPost] = useState<boolean>(false)
  const [showDiff, setShowDiff] = useState<boolean>(true) // Whether to show diff when viewing post
  const [voting, setVoting] = useState<boolean>(false)

  // Diff highlighting function for comparing post content with current page content
  const renderDiff = (postContent: string, currentContent: string) => {
    if (!postContent) {
      return <pre className="readonly-pre">{currentContent}</pre>
    }

    // If current content is empty, highlight everything as new
    if (!currentContent || currentContent.trim() === '') {
      return (
        <pre className="readonly-pre">
          <span 
            style={{ 
              backgroundColor: '#d1ecf1', 
              border: '1px solid #bee5eb',
              padding: '2px 4px',
              borderRadius: '3px',
              fontWeight: 'bold'
            }}
            title="This is all new content (page was previously empty)"
          >
            {postContent}
          </span>
        </pre>
      )
    }

    // Simple word-based diff highlighting
    const postWords = postContent.split(/(\s+)/)
    const currentWords = currentContent.split(/(\s+)/)
    
    const result: React.ReactElement[] = []
    
    postWords.forEach((word, index) => {
      if (word.trim().length === 0) {
        // Preserve whitespace
        result.push(<span key={index}>{word}</span>)
      } else if (!currentWords.includes(word)) {
        // Word is not in current version - highlight as new/changed
        result.push(
          <span 
            key={index} 
            style={{ 
              backgroundColor: '#d1ecf1', 
              border: '1px solid #bee5eb',
              padding: '1px 3px',
              borderRadius: '2px',
              fontWeight: 'bold'
            }}
            title="This text is different from the current page version"
          >
            {word}
          </span>
        )
      } else {
        // Word exists in current version - show normally
        result.push(<span key={index}>{word}</span>)
      }
    })

    return <pre className="readonly-pre">{result}</pre>
  }

  const handleVote = async () => {
    if (!currentPost || voting || !notebookId || !pageId) return
    
    setVoting(true)
    try {
      const res = await api.patch(`/api/notebooks/${notebookId}/pages/${pageId}/posts/${currentPost.post_id}/vote/`, {}, true)
      if (res.ok) {
        if (res.body.merged) {
          // Post was merged and deleted - redirect back to notebook
          navigate(`/notebook/${encodeURIComponent(notebookId || '')}`)
        } else {
          // Update the post data
          setCurrentPost((prev: any) => ({
            ...prev,
            votes: res.body.votes,
            voted: !prev.voted
          }))
        }
      } else {
        console.error('Failed to vote:', res)
      }
    } catch (e) {
      console.error('Error voting:', e)
    } finally {
      setVoting(false)
    }
  }

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
        
        // Load the current page content
        const res = await api.get(`/api/notebooks/${notebookId}/pages/${pageId}/`, true)
        if (!mounted) return
        if (res.ok && res.body) {
          setTitle(res.body.title || 'Untitled')
          // latest_version may be nested
          const latest = res.body.latest_version || res.body.latest || null
          setContent((latest && latest.content) || '')
        } else {
          setError('Failed to load page')
          return
        }

        // If we have a post ID, load the post content for comparison
        if (postId) {
          try {
            const postsRes = await api.get(`/api/notebooks/${notebookId}/pages/${pageId}/posts/`, true)
            if (postsRes.ok && Array.isArray(postsRes.body)) {
              const post = postsRes.body.find((p: any) => p.post_id === postId)
              if (post) {
                setPostContent(post.content || '')
                setCurrentPost(post)
                setIsViewingPost(true)
              }
            }
          } catch (e) {
            console.error('Error loading post:', e)
          }
        }
      } catch (e) {
        setError('Error loading page')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [notebookId, pageId, postId || '']) // Use empty string to keep array size consistent

  return (
    <div className="readonly-root">
      <div className="readonly-header">
        <button className="btn" onClick={() => navigate(`/notebook/${encodeURIComponent(notebookId || '')}`)}>Back</button>
        <h2 className="readonly-title">
          {title}
          {isViewingPost && <span style={{ color: '#666', fontSize: '0.8em', marginLeft: '10px' }}>(Viewing Post Changes)</span>}
        </h2>
      </div>
      
      {isViewingPost && (
        <div className="readonly-controls">
          <div className="diff-controls">
            <button 
              className={`btn ${showDiff ? 'primary' : ''}`}
              onClick={() => setShowDiff(true)}
            >
              Show Changes
            </button>
            <button 
              className={`btn ${!showDiff ? 'primary' : ''}`}
              onClick={() => setShowDiff(false)}
            >
              Show Post Only
            </button>
          </div>
          
          {currentPost && (
            <div className="voting-controls">
              <button 
                className={`btn vote-btn ${currentPost.voted ? 'voted' : ''}`}
                onClick={handleVote}
                disabled={voting}
                title={currentPost.voted ? 'Remove vote' : 'Vote for this post'}
              >
                {voting ? '...' : '▲'}
              </button>
              <span className="vote-count">
                {currentPost.votes || 0} votes
              </span>
            </div>
          )}
        </div>
      )}
      
      {loading ? (
        <div className="readonly-loading">Loading page...</div>
      ) : error ? (
        <div className="readonly-error">{error}</div>
      ) : (
        <div className="readonly-document">
          {isViewingPost ? 
            (showDiff ? renderDiff(postContent, content) : <pre className="readonly-pre">{postContent}</pre>) :
            <pre className="readonly-pre">{content}</pre>
          }
        </div>
      )}
    </div>
  )
}
