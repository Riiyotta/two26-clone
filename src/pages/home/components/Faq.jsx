import Raw from '../../../runtime/Raw.jsx'
import html from '../sections/Faq.html?raw'
import manifest from '../manifest.json'

/** Faq — original Webflow markup (section-faq), rendered verbatim. */
export default function Faq() {
  const { tag, attrs } = manifest.sections.find((s) => s.name === 'Faq')
  return <Raw tag={tag} attrs={attrs} html={html} />
}
