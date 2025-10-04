import { useState, forwardRef, useImperativeHandle } from 'react'
import './NotebookList.css'
import mockNotebooks from '../data/mockNotebooks'
import NotebookItem from './NotebookItem'

const NotebookList = forwardRef<{ showNewNotebookInput: () => void }>((props, ref) => {
  const [notebooks, setNotebooks] = useState(mockNotebooks)
  const [showNewNotebookInput, setShowNewNotebookInput] = useState(false)
  const [newNotebookName, setNewNotebookName] = useState('')
  const [showPrivacyStep, setShowPrivacyStep] = useState(false)
  const [isPrivate, setIsPrivate] = useState(true)
  const [showContributorsStep, setShowContributorsStep] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedContributors, setSelectedContributors] = useState<string[]>([])
  const [showNotebookPage, setShowNotebookPage] = useState(false)
  const [currentNotebook, setCurrentNotebook] = useState<any>(null)
  const [notebookContent, setNotebookContent] = useState('')
  
  // Mock data for registered users
  const allUsers = [
    'Alice Johnson', 'Bob Smith', 'Carol Davis', 'David Wilson', 
    'Emma Brown', 'Frank Miller', 'Grace Lee', 'Henry Taylor',
    'Ivy Chen', 'Jack Anderson', 'Kate Martinez', 'Liam O\'Connor'
  ]

  useImperativeHandle(ref, () => ({
    showNewNotebookInput: () => setShowNewNotebookInput(true)
  }))

  const handleNameSubmit = () => {
    if (newNotebookName.trim()) {
      setShowPrivacyStep(true)
    }
  }

  const handlePrivacySubmit = () => {
    if (isPrivate) {
      handleCreateNotebook()
    } else {
      setShowContributorsStep(true)
    }
  }

  const handleContributorToggle = (contributor: string) => {
    setSelectedContributors(prev => 
      prev.includes(contributor) 
        ? prev.filter(c => c !== contributor)
        : [...prev, contributor]
    )
  }

  const filteredUsers = searchQuery.trim() ? allUsers.filter(user => 
    user.toLowerCase() === searchQuery.toLowerCase()
  ) : []

  const handleNotebookClick = (notebook: any) => {
    if (notebook.isPrivate) {
      setCurrentNotebook(notebook)
      setShowNotebookPage(true)
    }
  }

  const handleBackToList = () => {
    setShowNotebookPage(false)
    setCurrentNotebook(null)
  }

  const handleCreateNotebook = () => {
    if (newNotebookName.trim()) {
      const newNotebook = {
        notebook_id: `nb-${Date.now()}`,
        title: newNotebookName.trim(),
        admin: { id: 'u-current', username: 'current_user' },
        user_ids: [{ id: 'u-current', username: 'current_user' }],
        isPrivate,
        contributors: isPrivate ? [] : selectedContributors,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        pages: []
      }
      setNotebooks([...notebooks, newNotebook])
      setNewNotebookName('')
      setShowNewNotebookInput(false)
      setShowPrivacyStep(false)
      setShowContributorsStep(false)
      setIsPrivate(true)
      setSelectedContributors([])
      setSearchQuery('')
    }
  }

  const handleCancel = () => {
    setNewNotebookName('')
    setShowNewNotebookInput(false)
    setShowPrivacyStep(false)
    setShowContributorsStep(false)
    setIsPrivate(true)
    setSelectedContributors([])
    setSearchQuery('')
  }

  if (showNotebookPage && currentNotebook) {
    return (
      <div className="notebook-page">
        <div className="notebook-header">
          <button onClick={handleBackToList} className="back-button">← Back to Notebooks</button>
          <h1 className="notebook-title">{currentNotebook.title}</h1>
        </div>
        <div className="notebook-editor">
          <textarea
            value={notebookContent}
            onChange={(e) => setNotebookContent(e.target.value)}
            placeholder="Start writing your notes here..."
            className="notebook-textarea"
            autoFocus
          />
        </div>
      </div>
    )
  }

  return (
    <div className="notebook-list-simple">
      {showNewNotebookInput && (
        <div className="new-notebook-modal">
          <div className="new-notebook-content">
            {!showPrivacyStep ? (
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
                />
                <div className="new-notebook-actions">
                  <button onClick={handleCancel} className="btn-cancel">Cancel</button>
                  <button onClick={handleNameSubmit} className="btn-create">Next</button>
                </div>
              </>
            ) : !showContributorsStep ? (
              <>
                <h3>Privacy Settings</h3>
                <p>Who can access this notebook?</p>
                <div className="privacy-options">
                  <label className="privacy-option">
                    <input
                      type="radio"
                      name="privacy"
                      value="private"
                      checked={isPrivate}
                      onChange={() => setIsPrivate(true)}
                    />
                    <span className="privacy-label">
                      <strong>Keep Private</strong>
                      <small>Only you can access this notebook</small>
                    </span>
                  </label>
                  <label className="privacy-option">
                    <input
                      type="radio"
                      name="privacy"
                      value="collaborative"
                      checked={!isPrivate}
                      onChange={() => setIsPrivate(false)}
                    />
                    <span className="privacy-label">
                      <strong>Add Contributors</strong>
                      <small>Invite others to collaborate</small>
                    </span>
                  </label>
                </div>
                <div className="new-notebook-actions">
                  <button onClick={() => setShowPrivacyStep(false)} className="btn-cancel">Back</button>
                  <button onClick={handlePrivacySubmit} className="btn-create">Next</button>
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
                  />
                </div>
                <div className="contributor-list">
                  {filteredUsers.map((user) => (
                    <label key={user} className="contributor-option">
                      <input
                        type="checkbox"
                        checked={selectedContributors.includes(user)}
                        onChange={() => handleContributorToggle(user)}
                      />
                      <span className="contributor-name">{user}</span>
                    </label>
                  ))}
                </div>
                {selectedContributors.length > 0 && (
                  <div className="selected-contributors">
                    <strong>Selected: </strong>
                    {selectedContributors.join(', ')}
                  </div>
                )}
                <div className="new-notebook-actions">
                  <button onClick={() => setShowContributorsStep(false)} className="btn-cancel">Back</button>
                  <button onClick={handleCreateNotebook} className="btn-create">Create</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      
      <ul className="notebook-list">
        {notebooks.map((notebook) => (
          <li key={notebook.notebook_id} onClick={() => handleNotebookClick(notebook)}>
            <NotebookItem notebook={notebook} />
          </li>
        ))}
      </ul>
    </div>
  )
})

export default NotebookList