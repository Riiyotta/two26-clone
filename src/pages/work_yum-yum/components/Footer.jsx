import Raw from '../../../runtime/Raw.jsx'
import html from '../sections/Footer.html?raw'
import manifest from '../manifest.json'

/** Footer — original Webflow markup (footer), rendered verbatim. */
export default function Footer() {
  const { tag, attrs } = manifest.sections.find((s) => s.name === 'Footer')
  return <Raw tag={tag} attrs={attrs} html={html} />
}
