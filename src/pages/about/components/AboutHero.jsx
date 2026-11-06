import Raw from '../../../runtime/Raw.jsx'
import html from '../sections/AboutHero.html?raw'
import manifest from '../manifest.json'

/** AboutHero — original Webflow markup (section-about-hero), rendered verbatim. */
export default function AboutHero() {
  const { tag, attrs } = manifest.sections.find((s) => s.name === 'AboutHero')
  return <Raw tag={tag} attrs={attrs} html={html} />
}
