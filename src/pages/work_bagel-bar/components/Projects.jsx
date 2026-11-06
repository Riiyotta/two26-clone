import Raw from '../../../runtime/Raw.jsx'
import html from '../sections/Projects.html?raw'
import manifest from '../manifest.json'

/** Projects — original Webflow markup (section-projects), rendered verbatim. */
export default function Projects() {
  const { tag, attrs } = manifest.sections.find((s) => s.name === 'Projects')
  return <Raw tag={tag} attrs={attrs} html={html} />
}
