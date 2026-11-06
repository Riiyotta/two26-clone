import Raw from '../../../runtime/Raw.jsx'
import html from '../sections/WorkHero.html?raw'
import manifest from '../manifest.json'

/** WorkHero — original Webflow markup (section-work-hero), rendered verbatim. */
export default function WorkHero() {
  const { tag, attrs } = manifest.sections.find((s) => s.name === 'WorkHero')
  return <Raw tag={tag} attrs={attrs} html={html} />
}
