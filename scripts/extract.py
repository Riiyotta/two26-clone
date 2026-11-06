"""Port the original two26.studio Webflow pages into the Vite/React project.

Usage: python3 -I scripts/extract.py <dir-with-saved-pages>

The directory holds one saved HTML file per route, named by page key:
  home.html, about.html, work.html, work_<slug>.html

For each page this writes src/pages/<key>/:
  sections/*.html      original markup per top-level element (rendered verbatim)
  scripts/NN.js        the page's inline <script>s, in document order
  components/*.jsx     one React component per section
  index.jsx            the page component (Loader, Header, sections, Footer)
  manifest.json        wf page id, head meta, section list, script order
Every CDN URL is rewritten to the local copy under /assets (see public/assets).
"""
import json, os, re, shutil, sys, urllib.parse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(ROOT, "public/assets")
SRC_CSS = os.path.join(ROOT, "Two26 Studio _ Boutique Design Studio_files",
                       "two-26-1dc3272b155235f70ebef7d3d0fb78a1.webflow.shared.f22dd83b1.css")

index = {}
for folder in ("media", "fonts", "lottie", "vendor"):
    for name in os.listdir(os.path.join(ASSETS, folder)):
        index[name] = folder
missing = set()

URL_RE = re.compile(r'https://(?:cdn\.prod\.website-files\.com|d3e54v103j8qbb\.cloudfront\.net|cdn\.jsdelivr\.net)/[^"\'\s>,]+')
CSS_URL_RE = re.compile(r'https://cdn\.prod\.website-files\.com/[^"\')\s]+')


def local(url):
    tail = ""
    if "&quot;" in url:                      # style="background-image:url(&quot;...&quot;)"
        url, rest = url.split("&quot;", 1)
        tail = "&quot;" + rest
    while url.endswith(")") and url.count(")") > url.count("("):
        url, tail = url[:-1], ")" + tail
    path = urllib.parse.unquote(url.split("?")[0])
    name = urllib.parse.unquote(path.rsplit("/", 1)[-1])
    folder = index.get(name)
    if folder:
        return "/assets/%s/%s" % (folder, urllib.parse.quote(name)) + tail
    if not url.endswith(".css") and url != "https://cdn.prod.website-files.com":
        missing.add(url)
    return url + tail


def localise(text, rx=URL_RE):
    return rx.sub(lambda m: local(m.group(0)), text)


def element(src, start):
    """(tag, attrs, inner_html, end) for the element whose opening tag starts at index `start`."""
    tag = re.match(r"<([a-z0-9]+)", src[start:]).group(1)
    gt = src.index(">", start)
    attrs = dict(re.findall(r'([\w:-]+)="([^"]*)"', src[start:gt]))
    depth, j = 1, gt + 1
    pat = re.compile(r"<(/?)%s\b[^>]*>" % tag)
    while depth:
        m = pat.search(src, j)
        depth += -1 if m.group(1) else 1
        j = m.end()
    return tag, attrs, src[gt + 1:m.start()], j


def children(src):
    """Top-level elements of an HTML fragment as (start, end) pairs."""
    out, i = [], 0
    while True:
        m = re.compile(r"<([a-z][a-z0-9]*)\b").search(src, i)
        if not m:
            return out
        _, _, _, end = element(src, m.start())
        out.append((m.start(), end))
        i = end


def pascal(s):
    s = re.sub(r"^section-", "", s)
    return "".join(p.capitalize() for p in re.split(r"[^a-zA-Z0-9]+", s) if p) or "Block"


COMPONENT = """import Raw from '../../../runtime/Raw.jsx'
import html from '../sections/{name}.html?raw'
import manifest from '../manifest.json'

/** {name} — original Webflow markup ({cls}), rendered verbatim. */
export default function {name}() {{
  const {{ tag, attrs }} = manifest.sections.find((s) => s.name === '{name}')
  return <Raw tag={{tag}} attrs={{attrs}} html={{html}} />
}}
"""


def build(key, html):
    out = os.path.join(ROOT, "src/pages", key)
    shutil.rmtree(out, ignore_errors=True)
    for d in ("sections", "scripts", "components"):
        os.makedirs(os.path.join(out, d))
    html = localise(html)
    head = html[:html.index("<body")]
    meta = {
        "wfPage": re.search(r'data-wf-page="([^"]+)"', html).group(1),
        "title": re.search(r"<title>(.*?)</title>", head, re.S).group(1),
        "description": (re.search(r'content="([^"]*)" name="description"', head) or [None, ""])[1],
    }
    body = html[html.index(">", html.index("<body")) + 1:html.rindex("</body>")]

    scripts = []

    def take(m):
        attrs, code = m.group(1), m.group(2)
        stype = re.search(r'type="([^"]+)"', attrs)
        if stype and stype.group(1) not in ("text/javascript", "module"):
            return m.group(0)
        src = re.search(r'src="([^"]+)"', attrs)
        if src:
            scripts.append({"src": src.group(1)})
            return "<!--script:%d-->" % (len(scripts) - 1)
        else:
            fn = "%02d.js" % len(scripts)
            open(os.path.join(out, "scripts", fn), "w", encoding="utf-8").write(code)
            scripts.append({"inline": fn})
        # keep the position: some embeds use document.currentScript.parentElement
        return "<!--script:%d-->" % (len(scripts) - 1)

    body = re.sub(r"<script([^>]*)>(.*?)</script>", take, body, flags=re.S)

    def write(name, text):
        open(os.path.join(out, "sections", name + ".html"), "w", encoding="utf-8").write(text)

    sections = []

    def section(name, start, src):
        tag, attrs, inner, _ = element(src, start)
        write(name, inner)
        sections.append({"name": name, "tag": tag, "attrs": attrs, "role": None})
        open(os.path.join(out, "components", name + ".jsx"), "w", encoding="utf-8").write(
            COMPONENT.format(name=name, cls=attrs.get("class", tag)))
        return sections[-1]

    loader_at = body.index('<div class="loader"')
    page_at = body.index('<div class="page"')
    write("Preamble", body[:loader_at])
    section("Loader", loader_at, body)["role"] = "loader"
    _, _, page_inner, page_end = element(body, page_at)
    write("Trailer", body[page_end:])

    used = set()
    for s, e in children(page_inner):
        tag = re.match(r"<([a-z0-9]+)", page_inner[s:]).group(1)
        if tag == "header":
            section("Header", s, page_inner)["role"] = "header"
        elif tag == "footer":
            section("Footer", s, page_inner)["role"] = "footer"
        elif tag == "main":
            _, _, main_inner, _ = element(page_inner, s)
            for ms, me in children(main_inner):
                cls = (re.search(r'class="([^"]+)"', main_inner[ms:main_inner.index(">", ms)]) or [None, "block"])[1]
                name = pascal(cls.split()[0])
                n, k = name, 2
                while n in used or n in ("Loader", "Header", "Footer"):
                    n, k = "%s%d" % (name, k), k + 1
                used.add(n)
                section(n, ms, main_inner)["role"] = "main"
        else:
            raise SystemExit("%s: unexpected <%s> inside .page" % (key, tag))

    json.dump({**meta, "sections": sections, "scripts": scripts},
              open(os.path.join(out, "manifest.json"), "w"), indent=2)

    def imports(role):
        return [s["name"] for s in sections if s["role"] == role]

    names = [s["name"] for s in sections]
    jsx = ["import PageShell from '../../runtime/PageShell.jsx'",
           "import manifest from './manifest.json'",
           "import preamble from './sections/Preamble.html?raw'",
           "import trailer from './sections/Trailer.html?raw'"]
    jsx += ["import %s from './components/%s.jsx'" % (n, n) for n in names]
    inline = "const inline = import.meta.glob('./scripts/*.js', { query: '?raw', import: 'default', eager: true })"
    main = "\n".join("        <%s />" % n for n in imports("main"))
    jsx += ["", inline, "",
            "/** %s — %s */" % (key, meta["title"]),
            "export default function Page() {",
            "  return (",
            "    <PageShell manifest={manifest} inline={inline} preamble={preamble} trailer={trailer}",
            "      loader={<Loader />} header={<Header />} footer={<Footer />}>",
            main,
            "    </PageShell>",
            "  )",
            "}", ""]
    open(os.path.join(out, "index.jsx"), "w", encoding="utf-8").write("\n".join(jsx))
    return [s["name"] for s in sections], len(scripts)


pages_dir = sys.argv[1]
os.makedirs(os.path.join(ROOT, "src/pages"), exist_ok=True)
routes = {}
for fn in sorted(os.listdir(pages_dir)):
    if not fn.endswith(".html"):
        continue
    key = fn[:-5]
    names, n = build(key, open(os.path.join(pages_dir, fn), encoding="utf-8").read())
    routes[key] = "/" if key == "home" else "/" + key.replace("_", "/")
    print("%-26s %2d scripts  %s" % (key, n, " ".join(names)))
json.dump(routes, open(os.path.join(ROOT, "src/pages/routes.json"), "w"), indent=2)

css = localise(open(SRC_CSS, encoding="utf-8").read(), CSS_URL_RE)
open(os.path.join(ROOT, "src/styles/webflow.css"), "w", encoding="utf-8").write(css)

print("missing assets:", *sorted(missing) or ["none"], sep="\n  ")
