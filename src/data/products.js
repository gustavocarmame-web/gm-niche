// Link da finalização de compra (Mercado Pago, Stripe, Shopify...).
// Enquanto estiver vazio, o carrinho funciona, mas o botão de finalizar fica desativado.
export const CHECKOUT_URL = ''

import catalog from './catalog.json'

// TROCAR: preço e estoque aplicados a todos os produtos. Valores provisórios.
export const DEFAULT_PRICE = 249
export const DEFAULT_STOCK = 10

// CONFIRMAR: uma das fotos diz "WHOOP 5.0/MG". Ajuste aqui se for o caso.
export const COMPATIBILITY = 'WHOOP 4.0 e MG'

// Gerado por scripts/import-products.mjs a partir das pastas de fotos.
// Descrição e preço por produto podem ser adicionados aqui depois, pelo id.
const OVERRIDES = {}

// Acabamentos que não aparecem no site, por produto (id). As fotos continuam na pasta.
const HIDDEN_FINISHES = {
  'you-are-your-only-limit': ['prata'],
}

export const products = catalog.map((p) => {
  const hidden = HIDDEN_FINISHES[p.id] ?? []
  const shown = p.variants.filter((v) => !hidden.includes(v.key))
  const variants = shown.length ? shown : p.variants
  return {
    ...p,
    variants,
    thumb: variants[0].thumb,
    // The ROLEX DIAMANTE folder (one product per photo) is its own series.
    series: p.group === 'rolex-diamante' ? 'Rolex Diamante' : p.series,
    price: DEFAULT_PRICE,
    stock: DEFAULT_STOCK,
    blurb: '',
    ...OVERRIDES[p.id],
  }
})

export const SERIES = ['Rolex', 'Rolex Diamante', 'No Risk', 'Gods Plan', 'Estampas']

// Cover image of each series card (product id). Series without an entry use their first product.
export const SERIES_COVER = {
  'Rolex Diamante': 'rolex-diamante-branco-dourado',
}

// Color of each clasp-finish dot on product cards.
export const FINISH_SWATCH = {
  prata: 'linear-gradient(135deg, #f4f4f5 0%, #b9bcc2 55%, #e6e7ea 100%)',
  'prata-fosco': '#aeb0b4',
  preto: '#141414',
  fosco: '#4a4a4c',
  dourado: 'linear-gradient(135deg, #f3dca0 0%, #c79f5d 55%, #e9cf8f 100%)',
  unico: '#d9d9d9',
}

// TROCAR: produtos da seção "Mais vendidos", na ordem em que aparecem. Use o id do produto.
export const BEST_SELLER_IDS = [
  'rolex-branco',
  'gods-plan',
  'rolex-diamante-branco-dourado',
  'no-risk-no-story-preto',
  'saint',
  'faith-over-fear',
  'rolex-marrom',
  'dream-big-work-hard',
]

export const packs = [
  {
    id: 'duo',
    name: 'Pack Duo',
    size: 2,
    price: 449,
    copy: 'Duas pulseiras à sua escolha. Uma para o dia, outra para a noite.',
    dark: true,
  },
  {
    id: 'trio',
    name: 'Pack Trio',
    size: 3,
    price: 599,
    copy: 'Três pulseiras por menos do que comprando separadas.',
    dark: false,
  },
]

export const findProduct = (id) => products.find((p) => p.id === id)
export const productImage = (id) => findProduct(id)?.thumb
export const findPack = (id) => packs.find((p) => p.id === id)

export const faqs = [
  {
    q: 'A pulseira serve na minha WHOOP?',
    a: `Serve na ${COMPATIBILITY}.`,
  },
  {
    q: 'Como acerto o tamanho?',
    a: 'Não precisa escolher tamanho. O fecho desliza e ajusta a pulseira em qualquer pulso até 24 cm.',
  },
  {
    q: 'Posso treinar e tomar banho com ela?',
    a: 'Pode. O tecido resiste a suor e água, então a pulseira acompanha treino, chuva e piscina.',
  },
  {
    q: 'Como funciona o pagamento?',
    a: 'Adicione as pulseiras ao carrinho e finalize a compra. O pagamento é por Pix ou cartão.',
  },
  {
    q: 'Quanto tempo demora para chegar?',
    a: 'Postamos em até 2 dias úteis depois do pagamento e enviamos o código de rastreio.',
  },
]

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
export function formatPrice(value) {
  return brl.format(value)
}
