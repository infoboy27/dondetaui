import React, { Suspense, lazy } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

// Headless card renderer for the Instagram autopilot; kept out of App so it
// skips the splash, auth and catalog hooks.
const IgRender = lazy(() => import('./screens/admin/IgRender'))

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {window.location.pathname === '/ig-render' ? (
      <Suspense fallback={null}>
        <IgRender />
      </Suspense>
    ) : (
      <BrowserRouter>
        <App />
      </BrowserRouter>
    )}
  </React.StrictMode>,
)
