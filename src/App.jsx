import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import Band3D from './components/Band3D.jsx'
import { products, packs, formatPrice, whatsappLink } from './data/products.js'

gsap.registerPlugin(ScrollTrigger)

const WA_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 12a9 9 0 0 1-13.3 7.9L3 21l1.2-4.5A9 9 0 1 1 21 12z" />
    <path d="M9 10.5c.4 1.6 1.9 3.2 3.6 3.7l1.4-1.2 2 1c-.4 1.3-1.5 1.9-2.7 1.7-2.8-.5-5.4-3.2-5.9-6-.2-1.2.4-2.3 1.7-2.7l1 2z" />
  </svg>
)

function useSmoothScroll() {
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) return
    const lenis = new Lenis({ lerp: 0.1, smoothWheel: true, anchors: { offset: -80 } })
    lenis.on('scroll', ScrollTrigger.update)
    const tick = (t) => lenis.raf(t * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)
    if (window.location.hash) {
      const target = document.querySelector(window.location.hash)
      if (target) setTimeout(() => lenis.scrollTo(target, { immediate: true, offset: -80 }), 300)
    }
    return () => {
      gsap.ticker.remove(tick)
      lenis.destroy()
    }
  }, [])
}

function Nav() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return (
    <header className={`nav ${scrolled ? 'scrolled' : ''}`}>
      <a href="#top" className="wordmark">GM NICHE</a>
      <nav className="nav-links">
        <a href="#colecao">Coleção</a>
        <a href="#packs">Packs</a>
        <a href="#como-pedir">Como pedir</a>
        <a href="#materiais">Materiais</a>
      </nav>
      <a className="btn" href={whatsappLink('Olá! Quero saber mais sobre as bandas GM NICHE.')} target="_blank" rel="noreferrer">
        {WA_ICON}<span>Pedir no WhatsApp</span>
      </a>
    </header>
  )
}

function Hero({ product }) {
  const root = useRef()
  const scrollRef = useRef(0)

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power4.out' } })
      tl.to('.hero h1 .line span', { y: 0, duration: 1.3, stagger: 0.12 }, 0.15)
        .to('.hero .reveal', { opacity: 1, y: 0, duration: 1, stagger: 0.12 }, 0.7)
      ScrollTrigger.create({
        trigger: root.current,
        start: 'top top',
        end: 'bottom top',
        onUpdate: (self) => { scrollRef.current = self.progress * 0.6 },
      })
    }, root)
    return () => ctx.revert()
  }, [])

  return (
    <section className="hero" id="top" ref={root}>
      <div className="hero-bg" />
      <div className="hero-copy">
        <h1 className="serif">
          <span className="line"><span>Sua WHOOP,</span></span>
          <span className="line"><span>do seu jeito.</span></span>
        </h1>
        <p className="reveal">Bandas em edição limitada, compatíveis com WHOOP 4.0 e MG. Troque de banda como troca de roupa: treino, trabalho, jantar.</p>
        <div className="hero-actions reveal">
          <a className="btn solid" href="#colecao">Ver a coleção</a>
          <a className="link" href="#como-pedir">Como pedir</a>
        </div>
      </div>
      <div className="hero-3d">
        <Band3D className="stage-canvas" color={product.color} clasp={product.clasp} scrollRef={scrollRef} sway={0.4} />
        <div className="hero-hint"><i />Mova o mouse para girar</div>
      </div>
    </section>
  )
}

function Marquee() {
  const items = ['Compatível com WHOOP 4.0 e MG', 'Fecho em aço inox', 'Largura 24 mm', 'Ajustável até 24 cm', 'Resistente a suor e água', 'Envio para todo o Brasil', 'Edições limitadas']
  const track = [...items, ...items]
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-track">
        {track.map((t, i) => <span key={i}>{t}</span>)}
      </div>
    </div>
  )
}

function Configurator({ selected, onSelect }) {
  const p = selected
  const msg = `Olá! Quero a banda ${p.name} (${p.tone}), ${formatPrice(p.price)}.`
  return (
    <section className="section" id="colecao">
      <div className="section-head reveal-up">
        <div>
          <h2 className="serif">A coleção</h2>
          <p>Poucas unidades de cada modelo. Quando acaba, não volta.</p>
        </div>
      </div>
      <div className="config">
        <div className="config-stage reveal-up">
          <Band3D className="stage-canvas" color={p.color} clasp={p.clasp} sway={0.55} float={false} distance={4.4} />
          <div className="stage-label">
            <b>{p.name}</b>
            <small>{p.tone}</small>
          </div>
          <div className="stage-price">{formatPrice(p.price)}</div>
          <div className="stage-hint">Escolha um modelo para ver na banda</div>
        </div>
        <div className="models reveal-up">
          {products.map((m) => (
            <div key={m.id}>
              <button
                className={`model ${m.id === p.id ? 'active' : ''} ${m.stock === 0 ? 'soldout' : ''}`}
                onMouseEnter={() => onSelect(m)}
                onFocus={() => onSelect(m)}
                onClick={() => onSelect(m)}
                aria-pressed={m.id === p.id}
              >
                <span className="swatch" style={{ background: m.color }} />
                <span>
                  <span className="model-name">{m.name}{m.limited && <small>Edição limitada</small>}</span>
                  <span className="model-tone">{m.tone}</span>
                </span>
                <span className="model-price">{m.stock === 0 ? 'Esgotado' : formatPrice(m.price)}</span>
              </button>
              {m.id === p.id && (
                <div className="model-detail">
                  <p>{m.blurb}</p>
                  <div className="row">
                    {m.stock > 0 ? (
                      <a className="btn solid" href={whatsappLink(msg)} target="_blank" rel="noreferrer">
                        {WA_ICON}<span>Pedir {m.name} no WhatsApp</span>
                      </a>
                    ) : (
                      <a className="btn" href={whatsappLink(`Olá! Quero ser avisado quando a banda ${m.name} voltar.`)} target="_blank" rel="noreferrer">
                        <span>Avisar quando voltar</span>
                      </a>
                    )}
                    {m.stock > 0 && m.stock <= 7 && <span className="stock">Restam {m.stock} unidades</span>}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Packs() {
  return (
    <section className="section" id="packs" style={{ paddingTop: 0 }}>
      <div className="packs">
        {packs.map((pk) => (
          <div key={pk.id} className={`pack reveal-up ${pk.dark ? 'dark' : ''}`}>
            <div>
              <h3 className="serif">{pk.name}</h3>
              <p>{pk.copy}</p>
            </div>
            <div className="pack-foot">
              <b>{formatPrice(pk.price)}</b>
              <a className="link" href={whatsappLink(`Olá! Quero montar o ${pk.name} (${formatPrice(pk.price)}).`)} target="_blank" rel="noreferrer">Montar o pack</a>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function HowTo() {
  return (
    <section className="section how" id="como-pedir">
      <div className="reveal-up">
        <h2 className="serif">Pedido direto no WhatsApp</h2>
        <p>Sem cadastro, sem carrinho. Você escolhe a banda, a gente confirma o estoque e envia o link de pagamento.</p>
      </div>
      <div className="steps reveal-up">
        <div className="step"><i>1</i><div><b>Escolha a banda</b><p>Toque em "Pedir no WhatsApp". A mensagem já vai com o modelo e a cor.</p></div></div>
        <div className="step"><i>2</i><div><b>Confirme e pague</b><p>Respondemos em até 1 dia útil com o link de pagamento por Pix ou cartão.</p></div></div>
        <div className="step"><i>3</i><div><b>Receba em casa</b><p>Postagem em até 2 dias úteis com código de rastreio.</p></div></div>
      </div>
    </section>
  )
}

function Materials({ product }) {
  return (
    <section className="section materials" id="materiais">
      <div className="materials-visual reveal-up">
        <Band3D className="stage-canvas" color={product.color} clasp={product.clasp} spin={0.22} sway={0} follow={false} float={false} distance={4.1} />
      </div>
      <div className="reveal-up">
        <h2 className="serif">Feita para o treino e para a noite</h2>
        <div className="spec"><span>Tecido</span><span>52% poliamida, 41% poliéster, 7% elastano</span></div>
        <div className="spec"><span>Fecho</span><span>Aço inoxidável com deslizador rápido</span></div>
        <div className="spec"><span>Largura</span><span>24 mm</span></div>
        <div className="spec"><span>Pulso</span><span>Ajustável até 24 cm</span></div>
        <div className="spec"><span>Uso</span><span>Resistente a suor e água</span></div>
      </div>
    </section>
  )
}

function CTA() {
  return (
    <section className="cta reveal-up">
      <h2 className="serif">Ficou com dúvida sobre qual escolher?</h2>
      <p>Manda mensagem. A gente responde com fotos no pulso e ajuda a montar o pack.</p>
      <a className="btn light" href={whatsappLink('Olá! Quero ajuda para escolher uma banda GM NICHE.')} target="_blank" rel="noreferrer">
        {WA_ICON}<span>Falar no WhatsApp</span>
      </a>
    </section>
  )
}

function Footer() {
  return (
    <footer className="footer">
      <div>
        <div className="wordmark">GM NICHE</div>
        <p>Bandas em edição limitada para WHOOP. Sem vínculo com a WHOOP, Inc.</p>
      </div>
      <div className="footer-cols">
        <div>
          <a href="#" target="_blank" rel="noreferrer">Instagram</a>
          <a href="#" target="_blank" rel="noreferrer">TikTok</a>
          <a href={whatsappLink('Olá!')} target="_blank" rel="noreferrer">WhatsApp</a>
        </div>
        <div>
          <a href="#">Trocas e devoluções</a>
          <a href="#">Envio</a>
          <a href="#">Privacidade</a>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} GM NICHE</span>
        <span>Feito no Brasil</span>
      </div>
    </footer>
  )
}

function useReveals() {
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray('.reveal-up').forEach((el) => {
        gsap.to(el, {
          opacity: 1, y: 0, duration: 1.1, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        })
      })
    })
    return () => ctx.revert()
  }, [])
}

export default function App() {
  const [selected, setSelected] = useState(products[0])
  useSmoothScroll()
  useReveals()
  return (
    <>
      <Nav />
      <main>
        <Hero product={selected} />
        <Marquee />
        <Configurator selected={selected} onSelect={setSelected} />
        <Packs />
        <HowTo />
        <Materials product={selected} />
        <CTA />
      </main>
      <Footer />
      <div className="sticky-cta">
        <a className="btn solid" href={whatsappLink(`Olá! Quero a banda ${selected.name} (${selected.tone}).`)} target="_blank" rel="noreferrer">
          {WA_ICON}<span>Pedir no WhatsApp</span>
        </a>
      </div>
    </>
  )
}
