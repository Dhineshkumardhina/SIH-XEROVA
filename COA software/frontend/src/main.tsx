import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Force white theme by default unless user changes it
const savedTheme = localStorage.getItem('railopt_theme')
if (savedTheme === 'dark') {
  document.documentElement.classList.add('dark')
} else {
  localStorage.setItem('railopt_theme', 'light')
  document.documentElement.classList.remove('dark')
  document.documentElement.classList.add('light')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
