import { useRef } from 'react'
import './App.css'
import NotebookList from './components/NotebookList'
import Header from './components/Header'

function App() {
  const notebookListRef = useRef<{ showNewNotebookInput: () => void }>(null)

  const handleNewNotebook = () => {
    if (notebookListRef.current) {
      notebookListRef.current.showNewNotebookInput()
    }
  }

  return (
    <div className="home-root">
      <Header onNewNotebook={handleNewNotebook} />

      <main className="home-main">
        <div className="panel-wrap">
          <NotebookList ref={notebookListRef} />
        </div>
      </main>
    </div>
  )
}

export default App
