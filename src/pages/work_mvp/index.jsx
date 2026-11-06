import PageShell from '../../runtime/PageShell.jsx'
import manifest from './manifest.json'
import preamble from './sections/Preamble.html?raw'
import trailer from './sections/Trailer.html?raw'
import Loader from './components/Loader.jsx'
import Header from './components/Header.jsx'
import ProjectHero from './components/ProjectHero.jsx'
import ProjectContent from './components/ProjectContent.jsx'
import Projects from './components/Projects.jsx'
import Footer from './components/Footer.jsx'

const inline = import.meta.glob('./scripts/*.js', { query: '?raw', import: 'default', eager: true })

/** work_mvp — Work — Two26 Creative Studio */
export default function Page() {
  return (
    <PageShell manifest={manifest} inline={inline} preamble={preamble} trailer={trailer}
      loader={<Loader />} header={<Header />} footer={<Footer />}>
        <ProjectHero />
        <ProjectContent />
        <Projects />
    </PageShell>
  )
}
