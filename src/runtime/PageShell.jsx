import { useEffect } from 'react'
import Raw from './Raw.jsx'
import replayScripts from './replayScripts.js'

/**
 * The structure every Webflow page on two26.studio shares:
 * global-style embed, .loader, .page > (header, main > sections, footer), Lenis styles.
 */
export default function PageShell({ manifest, inline, preamble, trailer, loader, header, footer, children }) {
  useEffect(() => { replayScripts(manifest, inline) }, [])
  return (
    <>
      <Raw attrs={{ style: 'display:contents' }} html={preamble} />
      {loader}
      <div className="page">
        {header}
        <main className="main">{children}</main>
        {footer}
      </div>
      <Raw attrs={{ style: 'display:contents' }} html={trailer} />
    </>
  )
}
