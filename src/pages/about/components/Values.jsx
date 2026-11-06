import Raw from '../../../runtime/Raw.jsx'
import html from '../sections/Values.html?raw'
import manifest from '../manifest.json'

/** Values — original Webflow markup (section-values), rendered verbatim. */
export default function Values() {
  const { tag, attrs } = manifest.sections.find((s) => s.name === 'Values')
  return <Raw tag={tag} attrs={attrs} html={html} />
}
