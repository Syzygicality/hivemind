import { useRef } from 'react'
import './App.css'
import NotebookList from './components/NotebookList'
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Header from './components/Header'
import { useState } from 'react'

function App() {
  const notebookListRef = useRef<{ showNewNotebookInput: () => void, closePageView?: () => void, addPage?: () => Promise<void>, openNotebookById?: (id: string) => void }>(null)

  const handleNewNotebook = () => {
    if (notebookListRef.current) {
      notebookListRef.current.showNewNotebookInput()
    }
  }

  const [activeNotebook, setActiveNotebook] = useState<any | null>(null)

  const handleReturn = () => {
    if (notebookListRef.current?.closePageView) {
      notebookListRef.current.closePageView()
    } else {
      window.location.href = '/'
    }
    setActiveNotebook(null)
  }

  const location = useLocation()

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const open = params.get('open')
    if (open && notebookListRef.current?.openNotebookById) {
      notebookListRef.current.openNotebookById(open)
    }
  }, [location.search])

  return (
    <div className="home-root">
  <Header onNewNotebook={handleNewNotebook} siteTitle={activeNotebook?.title || null} activeNotebookId={activeNotebook?.notebook_id} onReturn={handleReturn} onAddPage={() => { if (notebookListRef.current?.addPage) notebookListRef.current.addPage() }} />

      <main className="home-main">
        <div className="panel-wrap">
          <NotebookList ref={notebookListRef} onActiveNotebookChange={setActiveNotebook} />
        </div>
      </main>
    </div>
  )
}

export default App
