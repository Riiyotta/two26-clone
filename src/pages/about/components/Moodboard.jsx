import Raw from '../../../runtime/Raw.jsx'
import html from '../sections/Moodboard.html?raw'
import manifest from '../manifest.json'

/** Moodboard — original Webflow markup (section-moodboard), rendered verbatim. */
export default function Moodboard() {
  const { tag, attrs } = manifest.sections.find((s) => s.name === 'Moodboard')
  return <Raw tag={tag} attrs={attrs} html={html} />
}
