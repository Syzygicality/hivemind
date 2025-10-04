type Notebook = {
  notebook_id: string
  title: string
  admin?: { id: string; username: string }
  pages?: Array<{ page_id: string; title: string }>
  created_at?: string
  updated_at?: string
}

export default function NotebookItem({ notebook }: { notebook: Notebook }) {
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
    <div className="notebook-item">
      <div className="content card-top">
        <div className="nb-title">{notebook.title}</div>
        <div className="nb-meta">
          <span className="nb-admin">{notebook.admin?.username || 'Unknown'}</span>
          <span className="nb-pages">{notebook.pages?.length || 0} page(s)</span>
        </div>
      </div>

      <div className="content card-bottom">
        <div className="nb-dates">
          <div className="nb-created">Created: <span className="nb-date">{created.showTime ? (<><span className="nb-time">{created.time}</span> <span className="nb-rel">· {created.relative}</span></>) : (<span className="nb-rel">{created.relative}</span>)}</span></div>
          <div className="nb-updated">Updated: <span className="nb-date">{updated.showTime ? (<><span className="nb-time">{updated.time}</span> <span className="nb-rel">· {updated.relative}</span></>) : (<span className="nb-rel">{updated.relative}</span>)}</span></div>
        </div>
      </div>
    </div>
  )
}
