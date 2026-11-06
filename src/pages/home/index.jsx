import PageShell from '../../runtime/PageShell.jsx'
import manifest from './manifest.json'
import preamble from './sections/Preamble.html?raw'
import trailer from './sections/Trailer.html?raw'
import Loader from './components/Loader.jsx'
import Header from './components/Header.jsx'
import Hero from './components/Hero.jsx'
import About from './components/About.jsx'
import SliderShowcase from './components/SliderShowcase.jsx'
import Projects from './components/Projects.jsx'
import Services from './components/Services.jsx'
import Testimonials from './components/Testimonials.jsx'
import Faq from './components/Faq.jsx'
import Footer from './components/Footer.jsx'

const inline = import.meta.glob('./scripts/*.js', { query: '?raw', import: 'default', eager: true })

/** home — Two26 Studio | Boutique Design Studio */
export default function Page() {
  return (
    <PageShell manifest={manifest} inline={inline} preamble={preamble} trailer={trailer}
      loader={<Loader />} header={<Header />} footer={<Footer />}>
        <Hero />
        <About />
        <SliderShowcase />
        <Projects />
        <Services />
        <Testimonials />
        <Faq />
    </PageShell>
  )
}
