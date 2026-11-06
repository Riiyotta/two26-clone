import Raw from '../../../runtime/Raw.jsx'
import html from '../sections/Loader.html?raw'
import manifest from '../manifest.json'

/** Loader — original Webflow markup (loader), rendered verbatim. */
export default function Loader() {
  const { tag, attrs } = manifest.sections.find((s) => s.name === 'Loader')
  return <Raw tag={tag} attrs={attrs} html={html} />
}
