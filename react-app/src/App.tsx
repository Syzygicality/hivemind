import './App.css'
import NotebookList from './components/NotebookList'
import Header from './components/Header'

function App() {
  return (
    <div className="home-root">
      <Header />

      <main className="home-main">
        <div className="panel-wrap">
          <NotebookList />
        </div>
      </main>
    </div>
  )
}

export default App
