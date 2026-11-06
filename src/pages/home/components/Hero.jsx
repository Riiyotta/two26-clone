import Raw from '../../../runtime/Raw.jsx'
import html from '../sections/Hero.html?raw'
import manifest from '../manifest.json'

/** Hero — original Webflow markup (section-hero), rendered verbatim. */
export default function Hero() {
  const { tag, attrs } = manifest.sections.find((s) => s.name === 'Hero')
  return <Raw tag={tag} attrs={attrs} html={html} />
}
