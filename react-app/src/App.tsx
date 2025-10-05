import { useRef } from 'react'
import './App.css'
import NotebookList from './components/NotebookList'
import Header from './components/Header'
import { useState } from 'react'

function App() {
  const notebookListRef = useRef<{ showNewNotebookInput: () => void, closePageView?: () => void, addPage?: () => Promise<void> }>(null)

  const handleNewNotebook = () => {
    if (notebookListRef.current) {
      notebookListRef.current.showNewNotebookInput()
    }
  }

  const [activeNotebookTitle, setActiveNotebookTitle] = useState<string | null>(null)

  const handleReturn = () => {
    if (notebookListRef.current?.closePageView) {
      notebookListRef.current.closePageView()
    } else {
      window.location.href = '/'
    }
    setActiveNotebookTitle(null)
  }

  return (
    <div className="home-root">
  <Header onNewNotebook={handleNewNotebook} siteTitle={activeNotebookTitle} onReturn={handleReturn} onAddPage={() => { if (notebookListRef.current?.addPage) notebookListRef.current.addPage() }} />

      <main className="home-main">
        <div className="panel-wrap">
          <NotebookList ref={notebookListRef} onActiveNotebookChange={setActiveNotebookTitle} />
        </div>
      </main>
    </div>
  )
}

export default App
