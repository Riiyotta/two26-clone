const markers = () => {
  const found = {}
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_COMMENT)
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const m = /^script:(\d+)$/.exec(n.data)
    if (m) found[m[1]] = n
  }
  return found
}

const run = (entry, inline, marker) => new Promise((resolve) => {
  const s = document.createElement('script')
  if (entry.src) {
    s.src = entry.src
    s.async = false
    s.onload = s.onerror = () => resolve()
  } else {
    s.textContent = inline[`./scripts/${entry.inline}`]
  }
  // Insert where the original <script> sat, so document.currentScript.parentElement is right.
  if (marker) marker.parentNode.insertBefore(s, marker)
  else document.body.appendChild(s)
  if (!entry.src) resolve()
})

const waitForMedia = (timeout = 4000) => {
  const imgs = [...document.images].filter((i) => !i.complete && i.loading !== 'lazy')
  const all = Promise.all([
    document.fonts ? document.fonts.ready : null,
    ...imgs.map((i) => new Promise((r) => { i.addEventListener('load', r, { once: true }); i.addEventListener('error', r, { once: true }) })),
  ])
  return Promise.race([all, new Promise((r) => setTimeout(r, timeout))])
}

let started = false

/**
 * Replays a page's original <script>s in document order with the timing a static page gets:
 * embeds run while readyState === 'loading' (so they defer init to DOMContentLoaded), vendor
 * libs load after them, then DOMContentLoaded and load fire.
 */
export default async function replayScripts(manifest, inline) {
  if (started) return
  started = true
  Object.defineProperty(document, 'readyState', { configurable: true, get: () => 'loading' })
  const at = markers()
  for (const [i, entry] of manifest.scripts.entries()) await run(entry, inline, at[i])
  delete document.readyState // back to the real prototype getter
  document.dispatchEvent(new Event('DOMContentLoaded', { bubbles: true }))
  await waitForMedia()
  window.dispatchEvent(new Event('load'))
}
