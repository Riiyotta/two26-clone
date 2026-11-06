import { createElement, memo } from 'react'

const toProps = (attrs) => {
  const props = {}
  for (const [k, v] of Object.entries(attrs || {})) {
    if (k === 'class') props.className = v
    else if (k === 'style') props.style = Object.fromEntries(
      v.split(';').filter(Boolean).map((d) => {
        const [p, ...rest] = d.split(':')
        return [p.trim().replace(/-([a-z])/g, (_, c) => c.toUpperCase()), rest.join(':').trim()]
      }))
    else props[k] = v
  }
  return props
}

/**
 * Renders an element with the original Webflow inner markup verbatim.
 * memo + no props changes => React never re-renders it, so GSAP-owned DOM is left alone.
 */
const Raw = memo(function Raw({ tag = 'div', attrs, html }) {
  return createElement(tag, { ...toProps(attrs), dangerouslySetInnerHTML: { __html: html } })
}, () => true)

export default Raw
