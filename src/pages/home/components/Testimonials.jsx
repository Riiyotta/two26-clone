import Raw from '../../../runtime/Raw.jsx'
import html from '../sections/Testimonials.html?raw'
import manifest from '../manifest.json'

/** Testimonials — original Webflow markup (section-testimonials), rendered verbatim. */
export default function Testimonials() {
  const { tag, attrs } = manifest.sections.find((s) => s.name === 'Testimonials')
  return <Raw tag={tag} attrs={attrs} html={html} />
}
