// Troque pelo seu número com DDI e DDD, só dígitos. Ex.: 5511999998888
export const WHATSAPP_NUMBER = '5500000000000'

export const products = [
  {
    id: 'monza',
    name: 'Monza',
    tone: 'Preto',
    color: '#1A1B1E',
    clasp: '#B9B4AB',
    price: 249,
    stock: 7,
    blurb: 'Preto fosco com fecho em aço escovado. Da academia à reunião sem chamar atenção. Até alguém perguntar onde você comprou.',
  },
  {
    id: 'riviera',
    name: 'Riviera',
    tone: 'Cinza',
    color: '#8E8B86',
    clasp: '#C9C5BE',
    price: 249,
    stock: 12,
    blurb: 'Cinza pedra com trama fechada. O modelo que combina com qualquer relógio no outro pulso.',
  },
  {
    id: 'fairway',
    name: 'Fairway',
    tone: 'Branco',
    color: '#E8E5DE',
    clasp: '#C9C5BE',
    price: 249,
    stock: 5,
    blurb: 'Branco quente, fecho prateado. Fica melhor ainda depois de um verão inteiro de uso.',
  },
  {
    id: 'jet',
    name: 'Jet',
    tone: 'Azul marinho',
    color: '#1E2A44',
    clasp: '#B9B4AB',
    price: 249,
    stock: 9,
    blurb: 'Marinho profundo. Discreto de longe, com cor de perto.',
  },
  {
    id: 'alpine',
    name: 'Alpine',
    tone: 'Champanhe',
    color: '#C4AE84',
    clasp: '#D9C9A4',
    price: 349,
    stock: 3,
    blurb: 'Champanhe com fecho dourado. Edição limitada de 40 unidades.',
    limited: true,
  },
  {
    id: 'noir',
    name: 'Noir',
    tone: 'Grafite',
    color: '#3B3B3E',
    clasp: '#2A2A2C',
    price: 349,
    stock: 0,
    blurb: 'Grafite com fecho preto. Esgotou em quatro dias na primeira leva.',
    limited: true,
  },
]

export const packs = [
  {
    id: 'duo',
    name: 'Pack Duo',
    price: 449,
    copy: 'Duas bandas à sua escolha. Uma para o dia, outra para a noite.',
    dark: true,
  },
  {
    id: 'trio',
    name: 'Pack Trio',
    price: 599,
    copy: 'Três bandas por menos do que comprando separadas. Combinações exclusivas do pack.',
    dark: false,
  },
]

export function formatPrice(value) {
  return `R$ ${value.toLocaleString('pt-BR')}`
}

export function whatsappLink(message) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`
}
