import Raw from '../../../runtime/Raw.jsx'
import html from '../sections/Services.html?raw'
import manifest from '../manifest.json'

/** Services — original Webflow markup (section-services), rendered verbatim. */
export default function Services() {
  const { tag, attrs } = manifest.sections.find((s) => s.name === 'Services')
  return <Raw tag={tag} attrs={attrs} html={html} />
}
