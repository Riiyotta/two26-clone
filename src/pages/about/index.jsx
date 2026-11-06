import PageShell from '../../runtime/PageShell.jsx'
import manifest from './manifest.json'
import preamble from './sections/Preamble.html?raw'
import trailer from './sections/Trailer.html?raw'
import Loader from './components/Loader.jsx'
import Header from './components/Header.jsx'
import AboutHero from './components/AboutHero.jsx'
import Moodboard from './components/Moodboard.jsx'
import Values from './components/Values.jsx'
import WhatWeDo from './components/WhatWeDo.jsx'
import Footer from './components/Footer.jsx'

const inline = import.meta.glob('./scripts/*.js', { query: '?raw', import: 'default', eager: true })

/** about — About Us - Two26 Studio | Boutique Design Studio */
export default function Page() {
  return (
    <PageShell manifest={manifest} inline={inline} preamble={preamble} trailer={trailer}
      loader={<Loader />} header={<Header />} footer={<Footer />}>
        <AboutHero />
        <Moodboard />
        <Values />
        <WhatWeDo />
    </PageShell>
  )
}
