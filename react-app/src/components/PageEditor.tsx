import { useState } from 'react'
import api from '../lib/api'
import './PageEditor.css'

export default function PageEditor({ notebookId, draftId, initialContent, onClose, onSaved }: { notebookId: string, draftId: string, initialContent?: string, onClose: () => void, onSaved?: () => void }) {
  const [content, setContent] = useState(initialContent || '')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
          <button className="btn" onClick={onClose}>Exit</button>
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
