import api from '../lib/api'

interface HeaderProps {
  onNewNotebook: () => void
  siteTitle?: string | null
  onReturn?: () => void
  onAddPage?: () => void
}

export default function Header({ onNewNotebook, siteTitle, onReturn, onAddPage }: HeaderProps) {
  const handleLogout = async () => {
    try {
      await api.post('/auth/token/logout/', undefined, true)
    } catch (e) {
      // ignore
    }
    localStorage.removeItem('authToken')
    window.location.href = '/login'
  }

  return (
    <>
      <div className="site-title-bar">
        <div className="return-in-title">
          <button className="btn" onClick={() => { if (onReturn) onReturn(); else window.location.href = '/' }}>← Return to Notebooks</button>
        </div>
  <h1 className="site-title">{siteTitle ? siteTitle : 'My Hivemind'}</h1>
        <div className="logout-in-title">
          <button className="btn" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <header className="site-header">
        <div className="header-actions">
          {siteTitle ? (
            <button className="btn primary" onClick={() => { if (onAddPage) onAddPage() }}>Add Page</button>
          ) : (
            <button className="btn primary" onClick={onNewNotebook}>Create Notebook</button>
          )}
        </div>
      </header>
    </>
  )
}
