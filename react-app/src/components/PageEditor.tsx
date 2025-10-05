import { useState } from 'react'
import api from '../lib/api'
import './PageEditor.css'

export default function PageEditor({ notebookId, pageId, draftId, initialContent, onClose, onSaved }: { notebookId: string, pageId: string, draftId: string, initialContent?: string, onClose: () => void, onSaved?: () => void }) {
  const [content, setContent] = useState(initialContent || '')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPosting, setIsPosting] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)
    try {
      // update the draft content via PATCH
      const updateRes = await api.patch(`/api/notebooks/${notebookId}/drafts/${draftId}`, { content }, true)
      if (!updateRes.ok) {
        setError('Failed to save draft content')
        setIsSaving(false)
        return
      }

      if (onSaved) onSaved()
      onClose()
    } catch (e) {
      setError('Error saving draft')
      console.error(e)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="page-editor-modal">
      <div className="page-editor-content">
        <div className="page-editor-header">
          <h3>Edit Page</h3>
          <button className="btn" onClick={async () => {
            if (!pageId) return
            setIsPosting(true)
            setError(null)
            try {
              // create a post from this draft/content
              const postRes = await api.post(`/api/notebooks/${notebookId}/pages/${pageId}/posts/`, { draft_id: draftId, content }, true)
              if (!postRes.ok) {
                setError('Failed to create post')
                setIsPosting(false)
                return
              }
              // optionally refresh parent
              if (onSaved) onSaved()
              // close editor after posting
              onClose()
            } catch (e) {
              console.error(e)
              setError('Error creating post')
            } finally {
              setIsPosting(false)
            }
          }}>{isPosting ? 'Posting...' : 'Post'}</button>
        </div>
        {error && <div className="error-message">{error}</div>}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="page-editor-textarea"
          rows={20}
        />
        <div className="page-editor-actions">
          <button className="btn btn-cancel" onClick={onClose} disabled={isSaving}>Exit</button>
          <button className="btn btn-create" onClick={handleSave} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save'}</button>
        </div>
      </div>
    </div>
  )
}
