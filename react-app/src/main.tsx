import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App'
import LoginPage from './pages/LoginPage'
import AuthGuard from './components/AuthGuard'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/*" element={<AuthGuard><App /></AuthGuard>} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
