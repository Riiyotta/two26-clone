import { createRoot } from 'react-dom/client'
import './styles/webflow.css'
import './index.css'
import routes from './pages/routes.json'

const pages = import.meta.glob('./pages/*/index.jsx')
const manifests = import.meta.glob('./pages/*/manifest.json', { eager: true, import: 'default' })

// Same URLs as the original (Webflow is multi-page: links do full navigations).
const path = window.location.pathname.replace(/\/+$/, '') || '/'
const key = Object.keys(routes).find((k) => routes[k] === path) || 'home'
const manifest = manifests[`./pages/${key}/manifest.json`]

// Webflow reads these before initialising interactions.
document.documentElement.setAttribute('data-wf-page', manifest.wfPage)
document.title = manifest.title.replace(/&amp;/g, '&')
document.querySelector('meta[name="description"]')?.setAttribute('content', manifest.description)

pages[`./pages/${key}/index.jsx`]().then(({ default: Page }) => {
  // No StrictMode: the original GSAP scripts must initialise exactly once.
  createRoot(document.getElementById('root')).render(<Page />)
})
