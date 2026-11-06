import Raw from '../../../runtime/Raw.jsx'
import html from '../sections/WhatWeDo.html?raw'
import manifest from '../manifest.json'

/** WhatWeDo — original Webflow markup (section-what-we-do), rendered verbatim. */
export default function WhatWeDo() {
  const { tag, attrs } = manifest.sections.find((s) => s.name === 'WhatWeDo')
  return <Raw tag={tag} attrs={attrs} html={html} />
}
