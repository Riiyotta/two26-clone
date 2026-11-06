import Raw from '../../../runtime/Raw.jsx'
import html from '../sections/SliderShowcase.html?raw'
import manifest from '../manifest.json'

/** SliderShowcase — original Webflow markup (section-slider-showcase), rendered verbatim. */
export default function SliderShowcase() {
  const { tag, attrs } = manifest.sections.find((s) => s.name === 'SliderShowcase')
  return <Raw tag={tag} attrs={attrs} html={html} />
}
