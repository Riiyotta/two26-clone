import Raw from '../../../runtime/Raw.jsx'
import html from '../sections/ProjectsWork.html?raw'
import manifest from '../manifest.json'

/** ProjectsWork — original Webflow markup (section-projects-work none), rendered verbatim. */
export default function ProjectsWork() {
  const { tag, attrs } = manifest.sections.find((s) => s.name === 'ProjectsWork')
  return <Raw tag={tag} attrs={attrs} html={html} />
}
