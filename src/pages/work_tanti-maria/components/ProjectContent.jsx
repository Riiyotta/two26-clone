import Raw from '../../../runtime/Raw.jsx'
import html from '../sections/ProjectContent.html?raw'
import manifest from '../manifest.json'

/** ProjectContent — original Webflow markup (section-project-content), rendered verbatim. */
export default function ProjectContent() {
  const { tag, attrs } = manifest.sections.find((s) => s.name === 'ProjectContent')
  return <Raw tag={tag} attrs={attrs} html={html} />
}
