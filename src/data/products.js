// WhatsApp que recebe os pedidos: DDI 55 + DDD + número, só dígitos.
export const WHATSAPP_NUMBER = '5562996111870'

import catalog from './catalog.json'

// TROCAR: preço e estoque aplicados a todos os produtos. Valores provisórios.
export const DEFAULT_PRICE = 249
export const DEFAULT_STOCK = 10

export const COMPATIBILITY = 'WHOOP 5.0 e MG'

// Modelos de WHOOP que o cliente escolhe ao comprar.
export const WHOOP_MODELS = [
  { key: 'whoop-5', label: 'WHOOP 5.0' },
  { key: 'whoop-mg', label: 'WHOOP MG' },
]

// Gerado por scripts/import-products.mjs a partir das pastas de fotos.
// Descrição e preço por produto podem ser adicionados aqui depois, pelo id.
const OVERRIDES = {}

// Acabamentos que não aparecem no site, por produto (id). As fotos continuam na pasta.
const HIDDEN_FINISHES = {
  'you-are-your-only-limit': ['prata'],
}

// Trocas aplicadas só no que o site mostra (nomes de produtos e de coleções).
// As pastas de fotos, os ids e os endereços das páginas continuam iguais.
const WHO_CARES = 'WHO CARES I´M ALREADY LATE'
const displayName = (name) => name.replace(/FUCK/gi, 'F*CK').replace(/ROLEX/gi, WHO_CARES)

// Produtos que viram um só, com os fechos de cada parte como opções. Ordem dos fechos segue a lista.
// Endereços antigos das partes continuam funcionando e abrem o produto unido.
const MERGES = [
  { id: 'rolex-diamante-branco', name: 'ROLEX DIAMANTE BRANCO', parts: ['rolex-diamante-branco-prata', 'rolex-diamante-branco-dourado'] },
]
const ALIASES = Object.fromEntries(MERGES.flatMap((m) => m.parts.map((part) => [part, m.id])))

function applyMerges(list) {
  let out = list
  for (const m of MERGES) {
    const parts = m.parts.map((id) => out.find((p) => p.id === id)).filter(Boolean)
    if (parts.length < 2) continue
    const variants = parts.flatMap((p) => p.variants).filter((v, i, all) => all.findIndex((x) => x.key === v.key) === i)
    const merged = { ...parts[0], id: m.id, name: m.name, thumb: variants[0].thumb, variants }
    const at = out.indexOf(parts[0])
    out = out.filter((p) => !m.parts.includes(p.id))
    out.splice(Math.min(at, out.length), 0, merged)
  }
  return out
}

export const products = applyMerges(catalog).map((p) => {
  const hidden = HIDDEN_FINISHES[p.id] ?? []
  const shown = p.variants.filter((v) => !hidden.includes(v.key))
  const variants = shown.length ? shown : p.variants
  return {
    ...p,
    // Nomes vêm das pastas; palavras censuradas são trocadas só no que o site mostra.
    name: displayName(p.name),
    variants,
    thumb: variants[0].thumb,
    // The ROLEX DIAMANTE folder (one product per photo) is its own series.
    series: displayName(p.group === 'rolex-diamante' ? 'Rolex Diamante' : p.series),
    price: DEFAULT_PRICE,
    stock: DEFAULT_STOCK,
    blurb: '',
    ...OVERRIDES[p.id],
  }
})

export const SERIES = ['Rolex', 'Rolex Diamante', 'No Risk', 'Gods Plan', 'Estampas'].map(displayName)

// Cover image of each series card ("id" or "id:fecho"). Series without an entry use their first product.
export const SERIES_COVER = {
  [displayName('Rolex Diamante')]: 'rolex-diamante-branco:dourado',
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

// Produtos da seção "Mais vendidos", na ordem em que aparecem. Use o id do produto.
// Para abrir o card em um fecho específico, use "id:fecho" (ex.: 'rolex-marrom:dourado').
export const BEST_SELLER_IDS = [
  'fuck-9-5',
  'fuck-love-get-money',
  'no-risk-no-story-preto',
  'rolex-marrom:dourado',
  'saint',
  'faith-over-fear',
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

// Economia do pack em relação a comprar as pulseiras separadas. Arredonda para baixo
// para nunca anunciar um desconto maior que o real.
export function packSavings(pk) {
  const full = pk.size * DEFAULT_PRICE
  const amount = Math.max(0, full - pk.price)
  return { full, amount, percent: full ? Math.floor((amount / full) * 100) : 0 }
}

export const findProduct = (id) => products.find((p) => p.id === (ALIASES[id] ?? id))
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
    a: 'Adicione as pulseiras ao carrinho e toque em Finalizar compra. O resumo do pedido vai para o nosso WhatsApp, onde combinamos o frete e o pagamento por Pix ou cartão.',
  },
  {
    q: 'Quanto tempo demora para chegar?',
    a: 'Postamos em até 2 dias úteis depois do pagamento e enviamos o código de rastreio.',
  },
]

// Resumo do pedido enviado ao WhatsApp ao tocar em "Finalizar compra".
// *texto* fica em negrito no WhatsApp.
export function orderMessage(items, subtotal) {
  const pieces = items.reduce((n, i) => n + i.qty, 0)
  const lines = items.map((item, index) => [
    `${index + 1}) *${item.name}*`,
    `   ${item.detail}`,
    `   Quantidade: ${item.qty} x ${formatPrice(item.price)} = ${formatPrice(item.qty * item.price)}`,
  ].join('\n'))
  return [
    '*Novo pedido GM NICHE*',
    '',
    ...lines.flatMap((l) => [l, '']),
    `Itens: ${pieces}`,
    `*Total dos produtos: ${formatPrice(subtotal)}*`,
    'Frete: a combinar',
    '',
    'Gostaria de confirmar este pedido e combinar o frete e o pagamento.',
  ].join('\n')
}

export function whatsappOrderLink(items, subtotal) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(orderMessage(items, subtotal))}`
}

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
export function formatPrice(value) {
  return brl.format(value)
}
