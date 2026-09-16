import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, CaretLeft, CaretRight, Check, Handbag, List, Minus, Plus, Trash, X } from '@phosphor-icons/react'
import { products, packs, faqs, formatPrice, findProduct, findPack, whatsappOrderLink, SERIES, COMPATIBILITY, FINISH_SWATCH, BEST_SELLER_IDS, SERIES_COVER, WHOOP_MODELS, packSavings } from './data/products.js'
import { Link, useRoute, useTitle } from './router.jsx'
import { CartProvider, useCart } from './cart.jsx'

const ICON = { size: 22, weight: 'regular', 'aria-hidden': true }

// Side sheet shared by the menu and the cart: Escape closes, focus moves in and back out.
function Sheet({ open, onClose, side, label, children }) {
  const panel = useRef(null)
  const returnTo = useRef(null)
  useEffect(() => {
    if (!open) return
    returnTo.current = document.activeElement
    panel.current?.querySelector('button, a')?.focus()
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.documentElement.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.documentElement.style.overflow = ''
      returnTo.current?.focus?.()
    }
  }, [open, onClose])
  return (
    <div className={`sheet sheet-${side}`} data-open={open} aria-hidden={!open} inert={!open}>
      <div className="sheet-scrim" onClick={onClose} />
      <div className="sheet-panel" ref={panel} role="dialog" aria-modal="true" aria-label={label}>
        {children}
      </div>
    </div>
  )
}

function Header() {
  const [menu, setMenu] = useState(false)
  const cart = useCart()
  const links = [
    ['/#mais-vendidos', 'Mais vendidos'],
    ['/colecao', 'Produtos'],
    ['/#destaque', 'Destaque'],
    ['/#packs', 'Packs'],
    ['/#duvidas', 'Dúvidas'],
  ]
  return (
    <>
      <header className="header">
        <button className="icon-btn" onClick={() => setMenu(true)} aria-label="Abrir menu" aria-expanded={menu}>
          <List {...ICON} />
        </button>
        <Link to="/" className="logo-link" aria-label="GM NICHE, início">
          <img className="logo" src="/logo.png" width="1200" height="145" alt="" />
        </Link>
        <button className="icon-btn cart-btn" onClick={() => cart.setOpen(true)} aria-label={`Abrir carrinho, ${cart.count} ${cart.count === 1 ? 'item' : 'itens'}`}>
          <Handbag {...ICON} />
          {cart.count > 0 && <span className="cart-count" aria-hidden="true">{cart.count}</span>}
        </button>
      </header>
      <Sheet open={menu} onClose={() => setMenu(false)} side="left" label="Menu principal">
        <button className="icon-btn sheet-close" onClick={() => setMenu(false)} aria-label="Fechar menu"><X {...ICON} /></button>
        <nav className="menu-links">
          {links.map(([to, label]) => (
            <Link key={to} to={to} onClick={() => setMenu(false)}>{label}</Link>
          ))}
        </nav>
      </Sheet>
    </>
  )
}

function Stepper({ value, min = 1, max, onChange, label }) {
  return (
    <div className="stepper" role="group" aria-label={label}>
      <button onClick={() => onChange(value - 1)} disabled={value <= min} aria-label="Diminuir quantidade"><Minus size={16} aria-hidden /></button>
      <output aria-live="polite">{value}</output>
      <button onClick={() => onChange(value + 1)} disabled={value >= max} aria-label="Aumentar quantidade"><Plus size={16} aria-hidden /></button>
    </div>
  )
}

function CartDrawer() {
  const cart = useCart()
  const close = () => cart.setOpen(false)
  return (
    <Sheet open={cart.open} onClose={close} side="right" label="Carrinho">
      <div className="cart-head">
        <h2>Carrinho{cart.count > 0 && <span> ({cart.count})</span>}</h2>
        <button className="icon-btn" onClick={close} aria-label="Fechar carrinho"><X {...ICON} /></button>
      </div>
      {cart.items.length === 0 ? (
        <div className="cart-empty">
          <p>Seu carrinho está vazio.</p>
          <Link to="/colecao" className="btn" onClick={close}>Ver os produtos</Link>
        </div>
      ) : (
        <>
          <ul className="cart-lines">
            {cart.items.map((line) => (
              <li key={line.key}>
                <img src={line.image} alt="" width="900" height="900" />
                <div className="cart-line-body">
                  <div className="cart-line-top">
                    <b>{line.name}</b>
                    <span>{formatPrice(line.price * line.qty)}</span>
                  </div>
                  <p>{line.detail}</p>
                  <div className="cart-line-actions">
                    <Stepper value={line.qty} min={1} max={line.max} onChange={(q) => cart.setQty(line.key, q)} label={`Quantidade de ${line.name}`} />
                    <button className="text-btn" onClick={() => cart.remove(line.key)}>
                      <Trash size={16} aria-hidden /> Remover
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <div className="cart-foot">
            <div className="cart-total"><span>Subtotal</span><b>{formatPrice(cart.subtotal)}</b></div>
            <p>O resumo do pedido vai para o nosso WhatsApp, onde combinamos o frete e o pagamento.</p>
            <a className="btn solid wide" href={whatsappOrderLink(cart.items, cart.subtotal)} target="_blank" rel="noopener noreferrer">
              Finalizar compra
            </a>
          </div>
        </>
      )}
    </Sheet>
  )
}

/* ---------- Home ---------- */

// Transparent boomerang loop (forward + reversed, VP9 with alpha, no audio track).
// Browsers that play VP9 but drop the alpha channel (Safari) would paint a black box,
// so the first decoded frame is checked and those browsers get the transparent still instead.
function supportsTransparentVideo(v) {
  try {
    const c = document.createElement('canvas')
    c.width = 8
    c.height = 8
    const ctx = c.getContext('2d', { willReadFrequently: true })
    ctx.drawImage(v, 0, 0, 8, 8)
    return ctx.getImageData(0, 0, 1, 1).data[3] < 250
  } catch {
    return false
  }
}

function HeroVideo() {
  const video = useRef(null)
  const [still, setStill] = useState(false)

  useEffect(() => {
    const v = video.current
    if (!v) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => {
      if (reduce.matches) { v.pause(); v.currentTime = 0 }
      else v.play().catch(() => {})
    }
    const check = () => { if (!supportsTransparentVideo(v)) setStill(true) }
    const fail = () => setStill(true)
    if (v.readyState >= 2) check()
    else v.addEventListener('loadeddata', check, { once: true })
    v.addEventListener('error', fail, { once: true })
    sync()
    reduce.addEventListener('change', sync)
    return () => {
      v.removeEventListener('loadeddata', check)
      v.removeEventListener('error', fail)
      reduce.removeEventListener('change', sync)
    }
  }, [])

  if (still) {
    return <img className="hero-video" src="/video/hero-poster.webp" width="720" height="960" alt="" />
  }
  return (
    <video
      ref={video}
      className="hero-video"
      src="/video/hero-loop.webm"
      width="720"
      height="960"
      muted
      loop
      playsInline
      preload="auto"
      disablePictureInPicture
      aria-hidden="true"
      tabIndex={-1}
    />
  )
}

function Hero() {
  return (
    <section className="hero" id="top">
      <div className="hero-stage">
        <HeroVideo />
      </div>
      <div className="hero-copy">
        <h1>Sua WHOOP, do seu jeito.</h1>
        <p>Pulseiras em edição limitada para {COMPATIBILITY}</p>
        <Link to="/colecao" className="btn solid">Ver os produtos</Link>
      </div>
    </section>
  )
}

// Product card: photo + name + price, then one dot per clasp finish. Tapping a dot swaps
// the photo in place; the link carries the chosen finish into the product page.
function ProductCard({ p, eager = false, finish }) {
  const [key, setKey] = useState(() => (p.variants.some((x) => x.key === finish) ? finish : p.variants[0].key))
  const v = p.variants.find((x) => x.key === key) ?? p.variants[0]
  const href = p.variants.length > 1 ? `/produto/${p.id}?acabamento=${v.key}` : `/produto/${p.id}`
  return (
    <article className="card">
      <Link to={href} className="card-link">
        <span className="card-media">
          <img key={v.thumb} src={v.thumb} alt={`${p.name}, fecho ${v.label.toLowerCase()}`} width="600" height="600" loading={eager ? 'eager' : 'lazy'} decoding="async" />
          {p.stock === 0 && <span className="badge">Esgotado</span>}
        </span>
        <span className="card-name">{p.name}</span>
        <span className="card-price">{formatPrice(p.price)}</span>
      </Link>
      <div className="swatches" role="radiogroup" aria-label={`Cor do fecho de ${p.name}`}>
        {p.variants.map((x) => (
          <button
            key={x.key}
            type="button"
            role="radio"
            aria-checked={x.key === v.key}
            aria-label={x.label}
            title={x.label}
            className="swatch"
            style={{ '--swatch': FINISH_SWATCH[x.key] ?? FINISH_SWATCH.unico }}
            onClick={() => setKey(x.key)}
            // Warm the image cache so the swap is instant on tap.
            onPointerEnter={() => { const i = new Image(); i.src = x.thumb }}
          />
        ))}
      </div>
    </article>
  )
}

// Entries are "id" or "id:finish"; the finish picks which clasp the card opens on.
const BEST_SELLERS = BEST_SELLER_IDS
  .map((entry) => {
    const [id, finish] = entry.split(':')
    const product = findProduct(id)
    return product && { product, finish }
  })
  .filter(Boolean)

// One product per view on phones, several on desktop. Manual only: swipe or arrows, no autoplay.
function BestSellers() {
  const track = useRef(null)
  const [index, setIndex] = useState(0)
  const [perView, setPerView] = useState(1)
  const count = BEST_SELLERS.length

  useEffect(() => {
    const el = track.current
    if (!el) return
    const step = () => {
      const first = el.children[0]
      if (!first) return 0
      return first.getBoundingClientRect().width + parseFloat(getComputedStyle(el).columnGap || 0)
    }
    const update = () => {
      const s = step()
      if (!s) return
      setIndex(Math.min(count - 1, Math.round(el.scrollLeft / s)))
      setPerView(Math.max(1, Math.round(el.clientWidth / s)))
    }
    update()
    el.addEventListener('scroll', update, { passive: true })
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => { el.removeEventListener('scroll', update); ro.disconnect() }
  }, [count])

  const lastStart = Math.max(0, count - perView)
  const go = (dir) => {
    const el = track.current
    const first = el.children[0]
    const s = first.getBoundingClientRect().width + parseFloat(getComputedStyle(el).columnGap || 0)
    el.scrollTo({ left: Math.max(0, Math.min(lastStart, index + dir)) * s, behavior: 'smooth' })
  }

  if (count === 0) return null
  return (
    <section className="section best" id="mais-vendidos" aria-roledescription="carrossel" aria-label="Mais vendidos">
      <h2 className="section-title">Mais vendidos</h2>
      <ul className="best-track" ref={track}>
        {BEST_SELLERS.map(({ product: p, finish }, i) => (
          <li key={p.id} aria-label={`${i + 1} de ${count}`}><ProductCard p={p} finish={finish} eager={i < 2} /></li>
        ))}
      </ul>
      <div className="slider-nav">
        <button onClick={() => go(-1)} disabled={index <= 0} aria-label="Produto anterior"><CaretLeft size={22} aria-hidden /></button>
        <span aria-live="polite">{Math.min(index + 1, count)}/{count}</span>
        <button onClick={() => go(1)} disabled={index >= lastStart} aria-label="Próximo produto"><CaretRight size={22} aria-hidden /></button>
      </div>
      <div className="center">
        <Link to="/colecao" className="btn">Ver todos</Link>
      </div>
    </section>
  )
}

const FILTERS = [['todas', 'Todas'], ...SERIES.map((s) => [s, s])]

// Home preview: exactly two rows. 8 cards are rendered and CSS hides what exceeds two rows
// for the current column count (2 on phones, 3 on tablets, 4 on desktop).
function CollectionPreview() {
  return (
    <section className="section collection collection-preview" id="colecao">
      <h2 className="section-title">Produtos</h2>
      <ul className="product-grid">
        {products.slice(0, 8).map((p) => <li key={p.id}><ProductCard p={p} /></li>)}
      </ul>
      <div className="center grid-more">
        <Link to="/colecao" className="btn">Ver mais</Link>
      </div>
    </section>
  )
}

// Full catalog page. The series filter lives in ?serie= so series cards and shared links land pre-filtered.
function CollectionPage() {
  const [filter, setFilterState] = useState(() => {
    const wanted = new URLSearchParams(window.location.search).get('serie')
    return SERIES.includes(wanted) ? wanted : 'todas'
  })
  useTitle(filter === 'todas' ? 'Produtos | GM NICHE' : `${filter} | GM NICHE`)
  const setFilter = (key) => {
    setFilterState(key)
    const url = new URL(window.location.href)
    if (key === 'todas') url.searchParams.delete('serie')
    else url.searchParams.set('serie', key)
    window.history.replaceState(window.history.state, '', url.pathname + url.search)
  }
  const list = products.filter((p) => filter === 'todas' || p.series === filter)

  return (
    <section className="section collection collection-page">
      <BackLink to="/" label="Início" />
      <h1 className="section-title">Produtos</h1>
      <div className="collection-bar">
        <div className="filters" role="group" aria-label="Filtrar produtos">
          {FILTERS.map(([key, label]) => (
            <button key={key} className={filter === key ? 'active' : ''} aria-pressed={filter === key} onClick={() => setFilter(key)}>{label}</button>
          ))}
        </div>
        <span className="collection-count" aria-live="polite">{list.length} {list.length === 1 ? 'produto' : 'produtos'}</span>
      </div>
      <ul className="product-grid">
        {list.map((p, i) => <li key={p.id}><ProductCard p={p} eager={i < 4} /></li>)}
      </ul>
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

function Featured() {
  return (
    <section className="section feature" id="destaque">
      <div className="feature-copy">
        <h2 className="feature-title">
          <img className="feature-logo" src="/logo.png" width="1200" height="145" alt="GM NICHE" />
        </h2>
        <p className="feature-statement">Não é sobre pulseiras, é sobre <span className="gold-text">lifestyle</span>.</p>
        <Link to="/colecao" className="btn solid">Descubra seu estilo</Link>
      </div>
      <div className="feature-media">
        <img src="/lifestyle.webp" alt="Pulseira F*CK 9-5 no pulso, em uma mesa à beira-mar ao pôr do sol" width="1122" height="1402" loading="lazy" decoding="async" />
      </div>
    </section>
  )
}

function Categories() {
  const cats = SERIES.filter((s) => s !== 'Estampas').map((s) => {
    const items = products.filter((p) => p.series === s)
    const cover = findProduct(SERIES_COVER[s]) ?? items[0]
    return { key: s, label: s, img: cover.thumb, text: `${items.length} ${items.length === 1 ? 'modelo' : 'modelos'}` }
  }).filter((c) => c.img)
  return (
    <section className="section categories">
      <h2 className="section-title">Coleções</h2>
      <div className="cat-grid">
        {cats.map((c) => (
          <Link key={c.key} className="cat" to={`/colecao?serie=${encodeURIComponent(c.key)}`}>
            <span className="cat-media"><img src={c.img} alt="" width="600" height="600" loading="lazy" /></span>
            <span className="cat-label">{c.label}</span>
            <span className="cat-text">{c.text}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}

// Pack price with the separate-purchase total struck through, for screen readers read as a sentence.
function PackPrice({ pk, save }) {
  if (save.amount <= 0) return <b className="pack-price">{formatPrice(pk.price)}</b>
  return (
    <span className="pack-price">
      <s aria-hidden="true">{formatPrice(save.full)}</s>
      <b>{formatPrice(pk.price)}</b>
      <span className="visually-hidden">{`De ${formatPrice(save.full)} por ${formatPrice(pk.price)}, economia de ${formatPrice(save.amount)}`}</span>
    </span>
  )
}

function Packs() {
  return (
    <section className="section" id="packs">
      <h2 className="section-title">Packs</h2>
      <div className="packs">
        {packs.map((pk) => {
          const save = packSavings(pk)
          return (
          <div key={pk.id} className={`pack ${pk.dark ? 'dark' : ''}`}>
            <div>
              {save.percent > 0 && <span className="save-badge">Economize {save.percent}%</span>}
              <h3>{pk.name}</h3>
              <p>{pk.copy}</p>
            </div>
            <div className="pack-foot">
              <PackPrice pk={pk} save={save} />
              <Link to={`/pack/${pk.id}`} className={`btn ${pk.dark ? 'light' : ''}`}>Montar o pack</Link>
            </div>
          </div>
          )
        })}
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
            <summary>{f.q}<CaretRight size={18} aria-hidden /></summary>
            <p>{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  )
}

function HomePage() {
  useTitle('GM NICHE')
  return (
    <>
      <Hero />
      <BestSellers />
      <Marquee />
      <Featured />
      <Categories />
      <CollectionPreview />
      <Packs />
      <Faq />
    </>
  )
}

/* ---------- Product page ---------- */

function BackLink({ to = '/colecao', label = 'Produtos' }) {
  return (
    <Link to={to} className="back-link">
      <ArrowLeft size={18} aria-hidden /> {label}
    </Link>
  )
}

// Full-bleed photo carousel: swipe on phones (scroll-snap), arrows and keyboard on desktop,
// small dots show the position. No thumbnails.
function Gallery({ photos, name }) {
  const track = useRef(null)
  const [index, setIndex] = useState(0)
  const count = photos.length

  useEffect(() => {
    const el = track.current
    if (!el) return
    const update = () => setIndex(Math.min(count - 1, Math.max(0, Math.round(el.scrollLeft / el.clientWidth))))
    el.addEventListener('scroll', update, { passive: true })
    return () => el.removeEventListener('scroll', update)
  }, [count])

  const goTo = (n) => {
    const el = track.current
    const target = (n + count) % count
    el.scrollTo({ left: target * el.clientWidth, behavior: 'smooth' })
  }

  return (
    <div
      className="gallery"
      role="region"
      aria-roledescription="galeria"
      aria-label={`Fotos de ${name}`}
      tabIndex={count > 1 ? 0 : undefined}
      onKeyDown={(e) => {
        if (count < 2) return
        if (e.key === 'ArrowRight') { e.preventDefault(); goTo(index + 1) }
        if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(index - 1) }
      }}
    >
      <ul className="gallery-track" ref={track}>
        {photos.map((ph, n) => (
          <li key={ph.src} className="gallery-slide" aria-hidden={n !== index}>
            <img src={ph.src} alt={`${name}, foto ${n + 1} de ${count}`} width={ph.w} height={ph.h} loading={n === 0 ? 'eager' : 'lazy'} decoding="async" draggable="false" />
          </li>
        ))}
      </ul>
      {count > 1 && (
        <>
          <button className="gallery-arrow prev" onClick={() => goTo(index - 1)} aria-label="Foto anterior"><CaretLeft size={20} aria-hidden /></button>
          <button className="gallery-arrow next" onClick={() => goTo(index + 1)} aria-label="Próxima foto"><CaretRight size={20} aria-hidden /></button>
          <div className="gallery-dots">
            {photos.map((ph, n) => (
              <button key={ph.src} aria-label={`Ver foto ${n + 1} de ${count}`} aria-current={n === index} onClick={() => goTo(n)} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// Required choice of the customer's WHOOP model. Shows an inline message when the buy button
// is pressed without a choice; the caller scrolls here and focuses the first option.
function ModelPicker({ value, onChange, missing, name, pickerRef }) {
  const hintId = `${name}-hint`
  return (
    <fieldset className="model-picker" ref={pickerRef} data-missing={missing} aria-describedby={missing ? hintId : undefined}>
      <legend>Modelo da sua WHOOP</legend>
      <div className="model-options">
        {WHOOP_MODELS.map((m) => (
          <label key={m.key} className="model-option">
            <input type="radio" name={name} value={m.key} checked={value === m.key} onChange={() => onChange(m.key)} />
            <span>{m.label}</span>
          </label>
        ))}
      </div>
      {missing && <p className="model-hint" id={hintId} role="alert">Escolha o modelo da sua WHOOP para continuar.</p>}
    </fieldset>
  )
}

const modelLabel = (key) => WHOOP_MODELS.find((m) => m.key === key)?.label

// Scroll the picker into view and focus its first option.
function askForModel(ref) {
  const el = ref.current
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  el.querySelector('input')?.focus({ preventScroll: true })
}

function ProductPage({ id }) {
  const p = findProduct(id)
  const cart = useCart()
  // The card's color dot arrives as ?acabamento=<finish>; unknown values fall back to the first finish.
  const [variantKey, setVariantKey] = useState(() => {
    const wanted = new URLSearchParams(window.location.search).get('acabamento')
    return p?.variants.some((v) => v.key === wanted) ? wanted : p?.variants[0].key
  })
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const [model, setModel] = useState(null)
  const [modelMissing, setModelMissing] = useState(false)
  const pickerRef = useRef(null)
  const buyRef = useRef(null)
  const [buyVisible, setBuyVisible] = useState(true)
  useTitle(p ? `${p.name} | GM NICHE` : 'Produto não encontrado | GM NICHE')
  const chooseVariant = (key) => {
    setVariantKey(key)
    const url = new URL(window.location.href)
    url.searchParams.set('acabamento', key)
    window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash)
  }
  // Phone bar with price + add button shows once the main button has scrolled above the screen.
  // The huge bottom margin makes "below the screen" count as visible, so the only state change is
  // crossing the top edge; that change fires even when the page jumps past the button in one step.
  useEffect(() => {
    const el = buyRef.current
    if (!el) return
    // Several entries can queue up during a fast scroll; the last one is the current state.
    const io = new IntersectionObserver((entries) => setBuyVisible(entries[entries.length - 1].isIntersecting), { rootMargin: '0px 0px 100000px 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  useEffect(() => {
    if (!added) return
    const t = setTimeout(() => setAdded(false), 1800)
    return () => clearTimeout(t)
  }, [added])

  if (!p) return <NotFound />

  const variant = p.variants.find((v) => v.key === variantKey) ?? p.variants[0]
  const lineKey = `product:${p.id}:${variant.key}:${model}`
  // Stock is per product, shared across finishes.
  const inCart = cart.items.filter((l) => l.refId === p.id && l.kind === 'product').reduce((n, l) => n + l.qty, 0)
  const left = Math.max(0, p.stock - inCart)
  const others = products.filter((o) => o.id !== p.id && o.series === p.series).concat(products.filter((o) => o.series !== p.series)).slice(0, 4)

  const addToCart = () => {
    if (!model) { setModelMissing(true); askForModel(pickerRef); return }
    cart.add({
      key: lineKey, kind: 'product', refId: p.id,
      name: p.name, detail: `Fecho ${variant.label.toLowerCase()}, ${modelLabel(model)}`, price: p.price, image: variant.photos[0].src,
      max: Math.min(p.stock, (cart.items.find((l) => l.key === lineKey)?.qty ?? 0) + left),
    }, Math.min(qty, left))
    setAdded(true)
    setQty(1)
  }

  return (
    <article className="pdp">
      <div className="pdp-main">
        <div className="pdp-stage">
          <Gallery key={variant.key} photos={variant.photos} name={p.name} />
        </div>
        <div className="pdp-info">
          <BackLink />
          <h1>{p.name}</h1>
          <p className="pdp-tone">{p.series}</p>
          <p className="pdp-price">{formatPrice(p.price)}</p>
          {p.blurb && <p className="pdp-blurb">{p.blurb}</p>}

          <fieldset className="finish">
            <legend>Fecho: <b>{variant.label}</b></legend>
            <div className="finish-options">
              {p.variants.map((v) => (
                <label key={v.key} className="finish-option">
                  <input type="radio" name="acabamento" value={v.key} checked={v.key === variant.key} onChange={() => chooseVariant(v.key)} />
                  <img src={v.photos[0].src} alt="" width={v.photos[0].w} height={v.photos[0].h} loading="lazy" />
                  <span>{v.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {p.stock > 0 && (
            <ModelPicker name="modelo" value={model} missing={modelMissing && !model} pickerRef={pickerRef} onChange={(m) => { setModel(m); setModelMissing(false) }} />
          )}

          {p.stock === 0 ? (
            <button className="btn wide" disabled>Esgotado</button>
          ) : (
            <div className="pdp-buy" ref={buyRef}>
              <Stepper value={Math.min(qty, Math.max(1, left))} max={Math.max(1, left)} onChange={setQty} label="Quantidade" />
              <button className="btn solid add-btn" onClick={addToCart} disabled={left === 0} data-added={added}>
                <span className="add-label">{left === 0 ? 'Limite no carrinho' : 'Adicionar ao carrinho'}</span>
                <span className="add-done" aria-hidden={!added}><Check size={18} aria-hidden /> Adicionado</span>
              </button>
            </div>
          )}

        </div>
      </div>

      {p.stock > 0 && (
        <div className="buy-bar" data-show={!buyVisible} inert={buyVisible} aria-hidden={buyVisible}>
          <div>
            <b>{formatPrice(p.price)}</b>
            <span>{model ? `Fecho ${variant.label.toLowerCase()}, ${modelLabel(model)}` : 'Escolha o modelo da WHOOP'}</span>
          </div>
          <button className="btn solid" onClick={addToCart} disabled={left === 0}>{left === 0 ? 'Limite' : 'Adicionar'}</button>
        </div>
      )}

      <section className="section pdp-more">
        <h2 className="section-title">Veja também</h2>
        <ul className="more-grid">
          {others.map((o) => <li key={o.id}><ProductCard p={o} /></li>)}
        </ul>
      </section>
    </article>
  )
}

/* ---------- Pack page ---------- */

// Pack builder card: tap the photo to add/remove the pulseira, tap a dot to pick its clasp color.
// A dot on an unselected card also selects it while the pack still has room.
function PickCard({ p, finish, selected, disabled, onToggle, onFinish }) {
  const v = p.variants.find((x) => x.key === finish) ?? p.variants[0]
  return (
    <article className="pick-card" data-selected={selected}>
      <button className="pick" aria-pressed={selected} disabled={disabled} onClick={onToggle}>
        <span className="card-media">
          <img key={v.thumb} src={v.thumb} alt="" width="600" height="600" loading="lazy" decoding="async" />
          <span className="pick-mark" aria-hidden="true"><Check size={16} weight="bold" /></span>
        </span>
        <span className="card-name">{p.name}</span>
      </button>
      <div className="swatches" role="radiogroup" aria-label={`Cor do fecho de ${p.name}`}>
        {p.variants.map((x) => (
          <button
            key={x.key}
            type="button"
            role="radio"
            aria-checked={x.key === v.key}
            aria-label={x.label}
            title={x.label}
            className="swatch"
            style={{ '--swatch': FINISH_SWATCH[x.key] ?? FINISH_SWATCH.unico }}
            onClick={() => onFinish(x.key)}
          />
        ))}
      </div>
    </article>
  )
}

function PackPage({ id }) {
  const pk = findPack(id)
  const cart = useCart()
  const [picked, setPicked] = useState([])
  const [finishes, setFinishes] = useState({})
  const [series, setSeries] = useState('todas')
  const [model, setModel] = useState(null)
  const [modelMissing, setModelMissing] = useState(false)
  const [added, setAdded] = useState(false)
  useTitle(pk ? `${pk.name} | GM NICHE` : 'Pack não encontrado | GM NICHE')
  useEffect(() => {
    if (!added) return
    const t = setTimeout(() => setAdded(false), 2200)
    return () => clearTimeout(t)
  }, [added])
  if (!pk) return <NotFound />

  const save = packSavings(pk)
  const available = products.filter((p) => p.stock > 0 && (series === 'todas' || p.series === series))
  const full = picked.length === pk.size
  const finishOf = (pid) => finishes[pid] ?? findProduct(pid).variants[0].key
  const finishLabel = (pid) => {
    const prod = findProduct(pid)
    return (prod.variants.find((v) => v.key === finishOf(pid)) ?? prod.variants[0]).label
  }

  const toggle = (pid) => setPicked((cur) => (cur.includes(pid) ? cur.filter((x) => x !== pid) : cur.length < pk.size ? [...cur, pid] : cur))
  const chooseFinish = (pid, key) => {
    setFinishes((cur) => ({ ...cur, [pid]: key }))
    setPicked((cur) => (cur.includes(pid) || cur.length >= pk.size ? cur : [...cur, pid]))
  }

  const addPack = () => {
    if (!model) { setModelMissing(true); return }
    const parts = picked.map((pid) => `${pid}.${finishOf(pid)}`).sort()
    const first = findProduct(picked[0])
    cart.add({
      key: `pack:${pk.id}:${parts.join('+')}:${model}`, kind: 'pack', refId: pk.id,
      name: pk.name,
      detail: `${picked.map((pid) => `${findProduct(pid).name} (fecho ${finishLabel(pid).toLowerCase()})`).join(', ')}. ${modelLabel(model)}.`,
      price: pk.price,
      image: (first.variants.find((v) => v.key === finishOf(picked[0])) ?? first.variants[0]).thumb,
      max: Math.min(...picked.map((pid) => findProduct(pid).stock)),
    })
    setPicked([])
    setAdded(true)
  }

  return (
    <article className="section pack-page" data-bar={full}>
      <BackLink />
      <div className="pack-page-head">
        {save.percent > 0 && <span className="save-badge">Economize {save.percent}%</span>}
        <h1>{pk.name}</h1>
        <p>{pk.copy} Escolha {pk.size} modelos diferentes e a cor do fecho de cada um.</p>
      </div>
      <div className="filters" role="group" aria-label="Filtrar produtos">
        {FILTERS.map(([key, label]) => (
          <button key={key} className={series === key ? 'active' : ''} aria-pressed={series === key} onClick={() => setSeries(key)}>{label}</button>
        ))}
      </div>
      <p className="pick-progress" aria-live="polite">
        {added ? 'Pack adicionado ao carrinho. Monte outro se quiser.' : `${picked.length} de ${pk.size} escolhidos`}
      </p>
      <ul className="pick-grid">
        {available.map((p) => {
          const on = picked.includes(p.id)
          return (
            <li key={p.id}>
              <PickCard
                p={p}
                finish={finishOf(p.id)}
                selected={on}
                disabled={!on && full}
                onToggle={() => toggle(p.id)}
                onFinish={(key) => chooseFinish(p.id, key)}
              />
            </li>
          )
        })}
      </ul>

      {/* Fixed to the bottom of the screen; slides up only once the pack is complete. */}
      <div className="pack-bar" data-show={full} inert={!full} aria-hidden={!full} role="region" aria-label="Finalizar pack">
        <div className="pack-bar-summary">
          <b>Pack completo</b>
          <span>{picked.map((pid) => `${findProduct(pid).name} (${finishLabel(pid).toLowerCase()})`).join(', ')}</span>
        </div>
        <ModelPicker name="modelo-pack" value={model} missing={modelMissing && !model} onChange={(m) => { setModel(m); setModelMissing(false) }} />
        <div className="pack-bar-buy">
          <PackPrice pk={pk} save={save} />
          <button className="btn solid" onClick={addPack}>Adicionar</button>
        </div>
      </div>
    </article>
  )
}

function NotFound() {
  return (
    <section className="section not-found">
      <h1>Página não encontrada</h1>
      <p>Esse endereço não existe ou o modelo saiu da loja.</p>
      <Link to="/colecao" className="btn">Ver os produtos</Link>
    </section>
  )
}

/* ---------- Shell ---------- */

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-grid">
        <div>
          <img className="logo" src="/logo.png" width="1200" height="145" alt="GM NICHE" loading="lazy" />
          <p>Pulseiras em edição limitada para WHOOP. Sem vínculo com a WHOOP, Inc.</p>
        </div>
        <div>
          <h3>Loja</h3>
          <Link to="/colecao">Produtos</Link>
          <Link to="/#destaque">Destaque</Link>
          <Link to="/#packs">Packs</Link>
        </div>
        <div>
          <h3>Ajuda</h3>
          <Link to="/#duvidas">Dúvidas frequentes</Link>
          <a href="#">Trocas e devoluções</a>
          <a href="#">Privacidade</a>
        </div>
        <div>
          <h3>Redes</h3>
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

function Routes() {
  const route = useRoute()
  const key = route.name + (route.id ?? '')
  let page = <HomePage />
  if (route.name === 'product') page = <ProductPage id={route.id} />
  if (route.name === 'pack') page = <PackPage id={route.id} />
  if (route.name === 'collection') page = <CollectionPage />
  return <main id="conteudo" key={key} className="page">{page}</main>
}

export default function App() {
  // Deep link with a hash (e.g. /#packs) should land on that section after first render.
  useEffect(() => {
    if (window.location.hash) requestAnimationFrame(() => document.querySelector(window.location.hash)?.scrollIntoView())
  }, [])
  return (
    <CartProvider>
      <a className="skip-link" href="#conteudo">Pular para o conteúdo</a>
      <Header />
      <Routes />
      <Footer />
      <CartDrawer />
    </CartProvider>
  )
}
