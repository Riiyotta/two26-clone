import Raw from '../../../runtime/Raw.jsx'
import html from '../sections/About.html?raw'
import manifest from '../manifest.json'

/** About — original Webflow markup (section-about), rendered verbatim. */
export default function About() {
  const { tag, attrs } = manifest.sections.find((s) => s.name === 'About')
  return <Raw tag={tag} attrs={attrs} html={html} />
}
