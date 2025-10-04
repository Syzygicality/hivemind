interface HeaderProps {
  onNewNotebook: () => void
}

export default function Header({ onNewNotebook }: HeaderProps) {
  return (
    <>
      <div className="site-title-bar">
        <h1 className="site-title">My Hivemind</h1>
      </div>

      <header className="site-header">
        <div className="header-actions">
          <button className="btn">Add Notebook</button>
          <button className="btn primary" onClick={onNewNotebook}>Create Notebook</button>
        </div>
      </header>
    </>
  )
}
