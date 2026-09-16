import { useEffect, useSyncExternalStore } from 'react'

// Tiny history router: the store has three routes, so a library would be dead weight.
const subscribe = (cb) => {
  window.addEventListener('popstate', cb)
  return () => window.removeEventListener('popstate', cb)
}
const getPath = () => window.location.pathname

// The app decides where each page starts; the browser must not restore old offsets.
if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual'

export function navigate(to) {
  const url = new URL(to, window.location.origin)
  const next = url.pathname + url.search + url.hash
  if (next === window.location.pathname + window.location.search + window.location.hash) return
  const samePage = url.pathname === window.location.pathname
  window.history.pushState({}, '', next)
  window.dispatchEvent(new PopStateEvent('popstate'))
  // Scroll after the new page has rendered. 'instant' overrides the CSS smooth scroll,
  // which otherwise gets cancelled halfway when the old page unmounts.
  requestAnimationFrame(() => {
    const target = url.hash && document.querySelector(url.hash)
    if (target) target.scrollIntoView({ behavior: samePage ? 'smooth' : 'instant' })
    else window.scrollTo({ top: 0, behavior: 'instant' })
  })
}

export function useRoute() {
  const path = useSyncExternalStore(subscribe, getPath)
  const product = path.match(/^\/produto\/([\w-]+)\/?$/)
  if (product) return { name: 'product', id: product[1] }
  const pack = path.match(/^\/pack\/([\w-]+)\/?$/)
  if (pack) return { name: 'pack', id: pack[1] }
  if (/^\/colecao\/?$/.test(path)) return { name: 'collection' }
  return { name: 'home' }
}

// Internal link: real <a href> for middle-click and crawlers, client navigation for plain clicks.
export function Link({ to, onClick, ...props }) {
  return (
    <a
      href={to}
      onClick={(e) => {
        onClick?.(e)
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
        e.preventDefault()
        navigate(to)
      }}
      {...props}
    />
  )
}

export function useTitle(title) {
  useEffect(() => {
    document.title = title
  }, [title])
}
