import Raw from '../../../runtime/Raw.jsx'
import html from '../sections/Header.html?raw'
import manifest from '../manifest.json'

/** Header — original Webflow markup (header), rendered verbatim. */
export default function Header() {
  const { tag, attrs } = manifest.sections.find((s) => s.name === 'Header')
  return <Raw tag={tag} attrs={attrs} html={html} />
}
