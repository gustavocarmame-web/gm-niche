import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import { products, packs, faqs, formatPrice, whatsappLink, productImage } from './data/products.js'

// three.js is heavy: load it only when a 3D view is on screen.
const Band3D = lazy(() => import('./components/Band3D.jsx'))

const WA_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 12a9 9 0 0 1-13.3 7.9L3 21l1.2-4.5A9 9 0 1 1 21 12z" />
    <path d="M9 10.5c.4 1.6 1.9 3.2 3.6 3.7l1.4-1.2 2 1c-.4 1.3-1.5 1.9-2.7 1.7-2.8-.5-5.4-3.2-5.9-6-.2-1.2.4-2.3 1.7-2.7l1 2z" />
  </svg>
)

const Chevron = ({ dir = 'right' }) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ transform: dir === 'left' ? 'rotate(180deg)' : undefined }}>
    <path d="m9 6 6 6-6 6" />
  </svg>
)

const ANNOUNCEMENTS = [
  'Pedido direto pelo WhatsApp',
  'Envio para todo o Brasil',
  'Pagamento por Pix ou cartão',
]

function AnnouncementBar() {
  const [i, setI] = useState(0)
  const [paused, setPaused] = useState(false)
  const n = ANNOUNCEMENTS.length
  useEffect(() => {
    if (paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const t = setInterval(() => setI((v) => (v + 1) % n), 5000)
    return () => clearInterval(t)
  }, [n, paused])
  return (
    <div
      className="announce" role="region" aria-label="Avisos da loja"
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}
    >
      <button onClick={() => setI((i - 1 + n) % n)} aria-label="Aviso anterior"><Chevron dir="left" /></button>
      <p aria-live="polite">{ANNOUNCEMENTS[i]}</p>
      <button onClick={() => setI((i + 1) % n)} aria-label="Próximo aviso"><Chevron /></button>
    </div>
  )
}

function Header() {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])
  const links = [
    ['#colecao', 'Coleção'],
    ['#edicao-limitada', 'Edição limitada'],
    ['#packs', 'Packs'],
    ['#duvidas', 'Dúvidas'],
  ]
  return (
    <>
      <header className="header">
        <button className="icon-btn" onClick={() => setOpen(true)} aria-label="Abrir menu" aria-expanded={open}>
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M4 8h16M4 16h16" /></svg>
        </button>
        <a href="#top" className="logo-link" aria-label="GM NICHE, início"><img className="logo" src="/logo.png" width="1200" height="145" alt="" /></a>
        <a className="icon-btn" href={whatsappLink('Olá! Quero saber mais sobre as bandas GM NICHE.')} target="_blank" rel="noreferrer" aria-label="Falar no WhatsApp">
          {WA_ICON}
        </a>
      </header>
      <div className={`drawer ${open ? 'open' : ''}`} aria-hidden={!open} inert={!open}>
        <div className="drawer-scrim" onClick={() => setOpen(false)} />
        <nav className="drawer-panel" aria-label="Menu principal">
          <button className="icon-btn drawer-close" onClick={() => setOpen(false)} aria-label="Fechar menu">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
          {links.map(([href, label]) => (
            <a key={href} href={href} onClick={() => setOpen(false)}>{label}</a>
          ))}
          <a className="btn solid" href={whatsappLink('Olá! Quero saber mais sobre as bandas GM NICHE.')} target="_blank" rel="noreferrer">
            {WA_ICON}<span>Pedir no WhatsApp</span>
          </a>
        </nav>
      </div>
    </>
  )
}

function Hero() {
  return (
    <section className="hero" id="top">
      <div className="hero-stage" aria-hidden="true">
        <Suspense fallback={<img className="hero-fallback" src={productImage('fairway')} alt="" />}>
          <Band3D className="stage-canvas" color="#E8E5DE" clasp="#C9C5BE" sway={0.4} distance={4.4} shadow={false} />
        </Suspense>
      </div>
      <div className="hero-copy">
        <h1>Sua WHOOP, do seu jeito.</h1>
        <p>Bandas em edição limitada para WHOOP 4.0 e MG</p>
        <a className="btn light-solid" href="#colecao">Ver a coleção</a>
      </div>
    </section>
  )
}

const FILTERS = [
  ['todas', 'Todas'],
  ['classicas', 'Clássicas'],
  ['limitadas', 'Edição limitada'],
]

function Collection({ filter, setFilter, onOpen }) {
  const track = useRef(null)
  const [page, setPage] = useState(1)
  const list = products.filter((p) => filter === 'todas' || (filter === 'limitadas' ? p.limited : !p.limited))

  const pages = () => {
    const el = track.current
    if (!el) return 1
    return Math.max(1, Math.ceil(el.scrollWidth / el.clientWidth - 0.05))
  }
  const [total, setTotal] = useState(1)

  useEffect(() => {
    const el = track.current
    if (!el) return
    el.scrollTo({ left: 0 })
    const update = () => {
      setTotal(pages())
      setPage(Math.min(pages(), Math.round(el.scrollLeft / el.clientWidth) + 1))
    }
    update()
    el.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => { el.removeEventListener('scroll', update); window.removeEventListener('resize', update) }
  }, [filter])

  const go = (dir) => {
    const el = track.current
    el.scrollBy({ left: dir * el.clientWidth, behavior: 'smooth' })
  }

  return (
    <section className="section" id="colecao">
      <div className="collection-head">
        <h2 className="section-title">Mais vendidas</h2>
        <div className="filters" role="group" aria-label="Filtrar modelos">
          {FILTERS.map(([key, label]) => (
            <button key={key} className={filter === key ? 'active' : ''} aria-pressed={filter === key} onClick={() => setFilter(key)}>{label}</button>
          ))}
        </div>
      </div>
      <ul className="slider" ref={track}>
        {list.map((p) => (
          <li key={p.id}>
            <button className="card" onClick={() => onOpen(p)}>
              <span className="card-media">
                <img src={productImage(p.id)} alt={`Banda ${p.name} em ${p.tone.toLowerCase()}`} width="900" height="900" loading="lazy" />
                {p.stock === 0 && <span className="badge">Esgotado</span>}
                {p.stock > 0 && p.limited && <span className="badge gold">Edição limitada</span>}
              </span>
              <span className="card-name">{p.name}</span>
              <span className="card-price">{formatPrice(p.price)}</span>
              <span className="card-swatch" style={{ background: p.color }} aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
      <div className="slider-nav">
        <button onClick={() => go(-1)} disabled={page <= 1} aria-label="Modelos anteriores"><Chevron dir="left" /></button>
        <span aria-live="polite">{page}/{total}</span>
        <button onClick={() => go(1)} disabled={page >= total} aria-label="Próximos modelos"><Chevron /></button>
      </div>
      <div className="center">
        <a className="btn" href="#packs">Ver os packs</a>
      </div>
    </section>
  )
}

function Marquee() {
  const items = Array.from({ length: 16 })
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-track">
        {items.map((_, i) => <img className="logo" src="/logo.png" width="1200" height="145" key={i} alt="" loading="lazy" />)}
      </div>
    </div>
  )
}

function Limited({ onOpen }) {
  const alpine = products.find((p) => p.id === 'alpine')
  return (
    <section className="section feature" id="edicao-limitada">
      <div className="feature-copy">
        <h2 className="feature-title">Alpine, 40 unidades</h2>
        <p>Champanhe com fecho dourado. Quando acaba, não volta. Restam {alpine.stock} unidades.</p>
        <button className="btn" onClick={() => onOpen(alpine)}>Ver a Alpine</button>
      </div>
      <div className="feature-media">
        <img src={productImage('alpine')} alt="Banda Alpine em champanhe com fecho dourado" width="900" height="900" loading="lazy" />
      </div>
    </section>
  )
}

function Categories({ pick }) {
  const cats = [
    { key: 'classicas', label: 'Clássicas', img: 'monza', text: 'Preto, cinza, branco e marinho' },
    { key: 'limitadas', label: 'Edição limitada', img: 'alpine', text: 'Poucas unidades, sem reposição' },
    { key: 'packs', label: 'Packs', img: 'jet', text: 'Duas ou três bandas com desconto' },
  ]
  return (
    <section className="section categories">
      <h2 className="section-title">Categorias</h2>
      <div className="cat-grid">
        {cats.map((c) => (
          <a key={c.key} className="cat" href={c.key === 'packs' ? '#packs' : '#colecao'} onClick={() => c.key !== 'packs' && pick(c.key)}>
            <span className="cat-media"><img src={productImage(c.img)} alt="" width="900" height="900" loading="lazy" /></span>
            <span className="cat-label">{c.label}</span>
            <span className="cat-text">{c.text}</span>
          </a>
        ))}
      </div>
    </section>
  )
}

function Packs() {
  return (
    <section className="section" id="packs">
      <h2 className="section-title">Packs</h2>
      <div className="packs">
        {packs.map((pk) => (
          <div key={pk.id} className={`pack ${pk.dark ? 'dark' : ''}`}>
            <div>
              <h3>{pk.name}</h3>
              <p>{pk.copy}</p>
            </div>
            <div className="pack-foot">
              <b>{formatPrice(pk.price)}</b>
              <a className={`btn ${pk.dark ? 'light' : ''}`} href={whatsappLink(`Olá! Quero montar o ${pk.name} (${formatPrice(pk.price)}).`)} target="_blank" rel="noreferrer">Montar o pack</a>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function Faq() {
  return (
    <section className="section" id="duvidas">
      <div className="faq">
        <h2 className="section-title center">Dúvidas frequentes</h2>
        {faqs.map((f) => (
          <details key={f.q}>
            <summary>{f.q}<Chevron /></summary>
            <p>{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  )
}

function Club() {
  return (
    <section className="club">
      <h2 className="section-title">Entre para a lista</h2>
      <p>Avisamos no WhatsApp quando sai edição nova ou um modelo volta ao estoque.</p>
      <a className="btn solid" href={whatsappLink('Olá! Quero entrar na lista de lançamentos da GM NICHE.')} target="_blank" rel="noreferrer">
        {WA_ICON}<span>Entrar na lista</span>
      </a>
    </section>
  )
}

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-grid">
        <div>
          <img className="logo" src="/logo.png" width="1200" height="145" alt="GM NICHE" loading="lazy" />
          <p>Bandas em edição limitada para WHOOP. Sem vínculo com a WHOOP, Inc.</p>
        </div>
        <div>
          <h3>Loja</h3>
          <a href="#colecao">Coleção</a>
          <a href="#edicao-limitada">Edição limitada</a>
          <a href="#packs">Packs</a>
        </div>
        <div>
          <h3>Ajuda</h3>
          <a href="#duvidas">Dúvidas frequentes</a>
          <a href="#">Trocas e devoluções</a>
          <a href="#">Privacidade</a>
        </div>
        <div>
          <h3>Contato</h3>
          <a href={whatsappLink('Olá!')} target="_blank" rel="noreferrer">WhatsApp</a>
          <a href="#" target="_blank" rel="noreferrer">Instagram</a>
          <a href="#" target="_blank" rel="noreferrer">TikTok</a>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} GM NICHE</span>
        <span>Feito no Brasil</span>
      </div>
    </footer>
  )
}

function ProductModal({ product, onClose }) {
  const dialog = useRef(null)
  useEffect(() => {
    const d = dialog.current
    if (product && !d.open) d.showModal()
    if (!product && d.open) d.close()
  }, [product])

  const p = product
  return (
    <dialog ref={dialog} className="modal" onClose={onClose} onClick={(e) => e.target === dialog.current && onClose()} aria-labelledby="modal-title">
      {p && (
        <div className="modal-body">
          <button className="icon-btn modal-close" onClick={onClose} aria-label="Fechar">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
          <div className="modal-stage">
            <Suspense fallback={<img src={productImage(p.id)} alt="" />}>
              <Band3D className="stage-canvas" color={p.color} clasp={p.clasp} sway={0.5} float={false} distance={4.3} />
            </Suspense>
            <span className="modal-hint">Arraste o mouse para girar</span>
          </div>
          <div className="modal-info">
            {p.limited && <span className="badge gold static">Edição limitada</span>}
            <h2 id="modal-title">{p.name}</h2>
            <p className="modal-tone">{p.tone}</p>
            <p className="modal-price">{p.stock === 0 ? 'Esgotado' : formatPrice(p.price)}</p>
            <p>{p.blurb}</p>
            {p.stock > 0 ? (
              <a className="btn solid wide" href={whatsappLink(`Olá! Quero a banda ${p.name} (${p.tone}), ${formatPrice(p.price)}.`)} target="_blank" rel="noreferrer">
                {WA_ICON}<span>Pedir {p.name} no WhatsApp</span>
              </a>
            ) : (
              <a className="btn wide" href={whatsappLink(`Olá! Quero ser avisado quando a banda ${p.name} voltar.`)} target="_blank" rel="noreferrer">Avisar quando voltar</a>
            )}
            {p.stock > 0 && p.stock <= 7 && <p className="stock">Restam {p.stock} unidades</p>}
            <dl className="specs">
              <div><dt>Compatível</dt><dd>WHOOP 4.0 e MG</dd></div>
              <div><dt>Tecido</dt><dd>Poliamida, poliéster e elastano</dd></div>
              <div><dt>Fecho</dt><dd>Aço inoxidável</dd></div>
              <div><dt>Ajuste</dt><dd>Pulsos até 24 cm</dd></div>
            </dl>
          </div>
        </div>
      )}
    </dialog>
  )
}

export default function App() {
  const [filter, setFilter] = useState('todas')
  const [open, setOpen] = useState(null)
  // Mobile WhatsApp bar stays hidden until the hero button has scrolled away.
  const [pastHero, setPastHero] = useState(false)
  useEffect(() => {
    const onScroll = () => setPastHero(window.scrollY > window.innerHeight * 0.8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return (
    <>
      <a className="skip-link" href="#colecao">Pular para a coleção</a>
      <AnnouncementBar />
      <Header />
      <main>
        <Hero />
        <Collection filter={filter} setFilter={setFilter} onOpen={setOpen} />
        <Marquee />
        <Limited onOpen={setOpen} />
        <Categories pick={setFilter} />
        <Packs />
        <Faq />
        <Club />
      </main>
      <Footer />
      <ProductModal product={open} onClose={() => setOpen(null)} />
      <div className="sticky-cta" data-hidden={!pastHero} inert={!pastHero}>
        <a className="btn solid" href={whatsappLink('Olá! Quero comprar uma banda GM NICHE.')} target="_blank" rel="noreferrer">
          {WA_ICON}<span>Pedir no WhatsApp</span>
        </a>
      </div>
    </>
  )
}
