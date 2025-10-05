import React, { useEffect, useState } from 'react'
import api from '../lib/api'
import './VersionHistoryModal.css'

interface Version {
  version_id: string
  user_id: {
    id: string
    username: string
  }
  content: string
  created_at: string
}

interface VersionCompareData {
  version1: Version
  version2: Version
  page_title: string
}

interface VersionHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  notebookId: string
  pageId: string
  currentContent: string
}

export default function VersionHistoryModal({ 
  isOpen, 
  onClose, 
  notebookId, 
  pageId, 
  currentContent 
}: VersionHistoryModalProps) {
  const [versions, setVersions] = useState<Version[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [compareData, setCompareData] = useState<VersionCompareData | null>(null)
  const [showComparison, setShowComparison] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  // Diff highlighting function (reused from ReadOnlyView)
  const renderDiff = (newContent: string, oldContent: string) => {
    if (!newContent && !oldContent) {
      return <pre className="version-content-pre">No content</pre>
    }

    if (!oldContent || oldContent.trim() === '') {
      return (
        <pre className="version-content-pre">
          <span 
            style={{ 
              backgroundColor: '#d1ecf1', 
              border: '1px solid #bee5eb',
              padding: '2px 4px',
              borderRadius: '3px',
              fontWeight: 'bold'
            }}
            title="This is all new content (previous version was empty)"
          >
            {newContent}
          </span>
        </pre>
      )
    }

    if (!newContent || newContent.trim() === '') {
      return (
        <pre className="version-content-pre">
          <span 
            style={{ 
              backgroundColor: '#f8d7da', 
              border: '1px solid #f5c6cb',
              padding: '2px 4px',
              borderRadius: '3px',
              fontWeight: 'bold',
              color: '#721c24',
              textDecoration: 'line-through'
            }}
            title="All content was removed in this version"
          >
            {oldContent}
          </span>
        </pre>
      )
    }

    // Enhanced sentence-based diff highlighting
    const splitIntoSentences = (text: string) => {
      return text.split(/([.!?]+\s*)/).filter(s => s.length > 0)
    }
    
    const newSentences = splitIntoSentences(newContent)
    const oldSentences = splitIntoSentences(oldContent)
    
    const result: React.ReactElement[] = []
    
    // Create a merged view showing both additions and deletions inline
    const allSentences = [...new Set([...oldSentences, ...newSentences])]
    
    allSentences.forEach((sentence, index) => {
      if (sentence.trim().length === 0 || /^[.!?]+\s*$/.test(sentence)) {
        // Preserve punctuation and whitespace
        result.push(<span key={`merged-${index}`}>{sentence}</span>)
      } else {
        const inNew = newSentences.some(ps => ps.trim() === sentence.trim())
        const inOld = oldSentences.some(cs => cs.trim() === sentence.trim())
        
        if (inNew && inOld) {
          // Sentence exists in both - show normally
          result.push(<span key={`merged-${index}`}>{sentence}</span>)
        } else if (inNew && !inOld) {
          // Sentence added in new version - highlight in blue/teal
          result.push(
            <span 
              key={`merged-${index}`} 
              style={{ 
                backgroundColor: '#d1ecf1', 
                border: '1px solid #bee5eb',
                padding: '1px 3px',
                borderRadius: '2px',
                fontWeight: 'bold'
              }}
              title="This text was added in this version"
            >
              {sentence}
            </span>
          )
        } else if (!inNew && inOld) {
          // Sentence removed in new version - highlight in red
          result.push(
            <span 
              key={`merged-${index}`}
              style={{ 
                backgroundColor: '#f8d7da', 
                border: '1px solid #f5c6cb',
                padding: '1px 3px',
                borderRadius: '2px',
                fontWeight: 'bold',
                color: '#721c24',
                textDecoration: 'line-through'
              }}
              title="This text was removed in this version"
            >
              {sentence}
            </span>
          )
        }
      }
    })

    return <pre className="version-content-pre">{result}</pre>
  }

  const loadVersions = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get(`/api/notebooks/${notebookId}/pages/${pageId}/versions/`, true)
      if (res.ok && Array.isArray(res.body)) {
        setVersions(res.body)
      } else {
        setError('Failed to load version history')
      }
    } catch (e) {
      setError('Error loading version history')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const compareWithCurrent = async (version: Version) => {
    setCompareData({
      version1: version,
      version2: {
        version_id: 'current',
        user_id: { id: '', username: 'Current' },
        content: currentContent,
        created_at: new Date().toISOString()
      },
      page_title: ''
    })
    setShowComparison(true)
  }

  const compareVersions = async (version1: Version, version2: Version) => {
    try {
      const res = await api.get(
        `/api/notebooks/${notebookId}/pages/${pageId}/versions/compare/?version1=${version1.version_id}&version2=${version2.version_id}`,
        true
      )
      if (res.ok) {
        setCompareData(res.body)
        setShowComparison(true)
      } else {
        setError('Failed to compare versions')
      }
    } catch (e) {
      setError('Error comparing versions')
      console.error(e)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  useEffect(() => {
    if (isOpen) {
      loadVersions()
    } else {
      setShowComparison(false)
      setCompareData(null)
    }
  }, [isOpen, notebookId, pageId])

  if (!isOpen) return null

  return (
    <div className="version-modal-overlay" onClick={onClose}>
      <div className="version-modal" onClick={(e) => e.stopPropagation()}>
        <div className="version-modal-header">
          <h3>Version History</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="version-modal-content">
          {showComparison && compareData ? (
            <div className="version-comparison">
              <div className="comparison-header">
                <h4>Comparing Versions</h4>
                <div className="comparison-info">
                  <span className="version-label">
                    {compareData.version1.user_id.username} - {formatDate(compareData.version1.created_at)}
                  </span>
                  <span className="vs">vs</span>
                  <span className="version-label">
                    {compareData.version2.user_id.username} - {formatDate(compareData.version2.created_at)}
                  </span>
                </div>
                <button className="btn" onClick={() => setShowComparison(false)}>
                  Back to History
                </button>
              </div>
              <div className="comparison-content">
                {renderDiff(compareData.version2.content, compareData.version1.content)}
              </div>
            </div>
          ) : (
            <div className="version-list">
              {loading ? (
                <div className="loading">Loading version history...</div>
              ) : error ? (
                <div className="error">{error}</div>
              ) : versions.length === 0 ? (
                <div className="no-versions">No version history available</div>
              ) : (
                <>
                  <div className="version-list-header">
                    <span>Version ({versions.length} total)</span>
                    <span>Author</span>
                    <span>Date</span>
                    <span>Actions</span>
                  </div>
                  {versions.map((version, index) => (
                    <div key={version.version_id} className="version-item">
                      <span className="version-number">#{versions.length - index}</span>
                      <span className="version-author">{version.user_id.username}</span>
                      <span className="version-date">{formatDate(version.created_at)}</span>
                      <div className="version-actions">
                        <button 
                          className="btn btn-small"
                          onClick={() => compareWithCurrent(version)}
                        >
                          Compare with Current
                        </button>
                        {index > 0 && (
                          <button 
                            className="btn btn-small"
                            onClick={() => compareVersions(version, versions[index - 1])}
                          >
                            Compare with Previous
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}