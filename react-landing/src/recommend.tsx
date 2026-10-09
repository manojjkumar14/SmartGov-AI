import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import RecommendPage from '@/components/ui/recommend'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RecommendPage />
  </StrictMode>,
)
