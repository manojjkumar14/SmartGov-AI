import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Chatbot from '@/components/ui/chatbot'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Chatbot />
  </StrictMode>,
)
