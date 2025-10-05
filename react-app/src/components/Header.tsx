import api from '../lib/api'

interface HeaderProps {
  onNewNotebook: () => void
}

export default function Header({ onNewNotebook }: HeaderProps) {
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
        <h1 className="site-title">My Hivemind</h1>
        <div className="logout-in-title">
          <button className="btn" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <header className="site-header">
        <div className="header-actions">
          <button className="btn primary" onClick={onNewNotebook}>Create Notebook</button>
        </div>
      </header>
    </>
  )
}
