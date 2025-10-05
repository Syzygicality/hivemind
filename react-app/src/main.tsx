import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App'
import LoginPage from './pages/LoginPage'
import AuthGuard from './components/AuthGuard'
import ReadOnlyView from './components/ReadOnlyView'
import PostsGrid from './components/PostsGrid'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
  <Route path="/view/:notebookId/:pageId" element={<AuthGuard><ReadOnlyView /></AuthGuard>} />
  <Route path="/posts/:notebookId" element={<AuthGuard><PostsGrid /></AuthGuard>} />
        <Route path="/*" element={<AuthGuard><App /></AuthGuard>} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
