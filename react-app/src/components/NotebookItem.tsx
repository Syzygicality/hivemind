type Notebook = {
  notebook_id: string
  title: string
  admin?: { id: string; username: string }
  pages?: Array<{ page_id: string; title: string }>
  created_at?: string
  updated_at?: string
  isPrivate?: boolean
  contributors?: string[]
}

type NotebookItemProps = {
  notebook: Notebook
  currentUser?: { id: string }
  onDelete?: (id: string) => void | Promise<void>
}

export default function NotebookItem({ notebook, currentUser, onDelete }: NotebookItemProps) {
  const formatParts = (iso?: string) => {
    if (!iso) return { time: '—', relative: '—' }
    const d = new Date(iso)
    const now = new Date()
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000) // seconds

    // relative
    let relative = ''
    if (diff < 60) relative = 'just now'
    else if (diff < 3600) {
      const m = Math.floor(diff / 60)
      relative = `${m} minute${m > 1 ? 's' : ''} ago`
    } else if (diff < 86400) {
      const h = Math.floor(diff / 3600)
      relative = `${h} hour${h > 1 ? 's' : ''} ago`
    } else {
      const days = Math.floor(diff / 86400)
      relative = `${days} day${days > 1 ? 's' : ''} ago`
    }

    // time (12-hour)
    let hours = d.getHours()
    const minutes = d.getMinutes()
    const ampm = hours >= 12 ? 'PM' : 'AM'
    hours = hours % 12
    if (hours === 0) hours = 12
    const mins = minutes.toString().padStart(2, '0')
    const time = `${hours}:${mins} ${ampm}`

    // show exact time when the timestamp falls on the same calendar day (local)
    const sameDay = d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()
    const showTime = sameDay
    return { time, relative, showTime }
  }

  const created = formatParts(notebook.created_at)
  const updated = formatParts(notebook.updated_at)

  return (
    <div className={`notebook-item ${notebook.isPrivate ? 'clickable' : ''}`}>
      {/* top-right actions (delete for admins) */}
      {currentUser && notebook.admin && currentUser.id === notebook.admin.id && (
        <div className="nb-top-actions">
          <button
            className="btn secondary nb-delete"
            onClick={(e) => { e.stopPropagation(); if (onDelete) onDelete(notebook.notebook_id) }}
            aria-label={`Delete notebook ${notebook.title}`}
          >
            Delete
          </button>
        </div>
      )}
      <div className="content card-top">
        <div className="nb-title">{notebook.title}</div>
        <div className="nb-meta">
          <span className="nb-admin">{notebook.admin?.username || 'Unknown'}</span>
        </div>
        {/* contributors list (if any) */}
        {notebook.contributors && notebook.contributors.length > 0 && (
          <div className="nb-contributors">
            {notebook.contributors.length <= 2 ? (
              notebook.contributors.join(', ')
            ) : (
              `${notebook.contributors.slice(0, 2).join(', ')} +${notebook.contributors.length - 2}`
            )}
          </div>
        )}
      </div>

      <div className="content card-bottom">
        <div className="nb-dates">
          <div className="nb-created">
            <div className="nb-label">Created</div>
            <div className="nb-date">
              {created.showTime ? (
                <>
                  <span className="nb-time">{created.time}</span>
                  <span className="nb-rel">· {created.relative}</span>
                </>
              ) : (
                <span className="nb-rel">{created.relative}</span>
              )}
            </div>
          </div>

          <div className="nb-updated">
            <div className="nb-label">Updated</div>
            <div className="nb-date">
              {updated.showTime ? (
                <>
                  <span className="nb-time">{updated.time}</span>
                  <span className="nb-rel">· {updated.relative}</span>
                </>
              ) : (
                <span className="nb-rel">{updated.relative}</span>
              )}
            </div>
          </div>
        </div>
        {/* Delete button moved to the top-right */}
      </div>
    </div>
  )
}
