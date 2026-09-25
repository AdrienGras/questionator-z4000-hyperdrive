import './index.css'
import { createHashHistory, RouterProvider } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createAppRouter } from '@/app/router'

// Dev uniquement (D23) : sans cet import rien n'évaluerait src/db/db.ts tant qu'aucune feature ne
// l'utilise, et window.__questionatorDb resterait undefined. Vite élimine la branche en prod.
if (import.meta.env.DEV) void import('@/lib/db/db')

const router = createAppRouter(createHashHistory())

const root = document.getElementById('root')
if (!root) throw new Error('Élément #root introuvable')

createRoot(root).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
