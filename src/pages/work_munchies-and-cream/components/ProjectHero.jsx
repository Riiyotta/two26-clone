import Raw from '../../../runtime/Raw.jsx'
import html from '../sections/ProjectHero.html?raw'
import manifest from '../manifest.json'

/** ProjectHero — original Webflow markup (section-project-hero), rendered verbatim. */
export default function ProjectHero() {
  const { tag, attrs } = manifest.sections.find((s) => s.name === 'ProjectHero')
  return <Raw tag={tag} attrs={attrs} html={html} />
}
