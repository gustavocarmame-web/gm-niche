// Importa os produtos de uma pasta com uma subpasta por produto.
// Uso:
//   node scripts/import-products.mjs ["C:\\caminho\\FOTOS WHOOP"]
//     Importação completa: recria public/products e src/data/catalog.json.
//   node scripts/import-products.mjs --pasta "ROLEX DIAMANTE" ["C:\\caminho\\FOTOS WHOOP"]
//     Só uma pasta: troca apenas os produtos dela no catálogo e mantém o resto.
// A pasta de origem só é lida. Nada nela é alterado.
import { readdir, readFile, mkdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const args = process.argv.slice(2)
const onlyIdx = args.indexOf('--pasta')
const ONLY = onlyIdx >= 0 ? args[onlyIdx + 1] : null
const positional = args.filter((_, i) => i !== onlyIdx && i !== onlyIdx + 1)
const SOURCE = positional[0] || 'C:\\Users\\Gustavo\\Desktop\\FOTOS WHOOP'

const ROOT = path.resolve(import.meta.dirname, '..')
const OUT_IMG = path.join(ROOT, 'public', 'products')
const OUT_JSON = path.join(ROOT, 'src', 'data', 'catalog.json')
const IMAGE_EXT = new Set(['.webp', '.jpg', '.jpeg', '.png', '.avif'])
const SKIP_FOLDERS = new Set(['nova pasta'])
// In these folders every photo is a separate product (band color + clasp), not a gallery.
const SPLIT_FOLDERS = new Set(['rolex diamante'])

const FINISHES = [
  { key: 'prata', label: 'Prata' },
  { key: 'prata-fosco', label: 'Prata fosco' },
  { key: 'preto', label: 'Preto' },
  { key: 'fosco', label: 'Fosco' },
  { key: 'dourado', label: 'Dourado' },
]

const slug = (s) => s
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

function seriesOf(name) {
  const n = name.toUpperCase()
  if (n.startsWith('ROLEX')) return 'Rolex'
  if (n.startsWith('NO RISK')) return 'No Risk'
  if (n.startsWith('GODS PLAN')) return 'Gods Plan'
  return 'Estampas'
}

// File names mix finish, extra-image markers and typos: "PRATA IMG2", "IMG 2 PRATA", "PRAT6A IMG2", "PRA IMG 2", "PRETA".
function parseFile(base) {
  const upper = base.toUpperCase().trim()
  const imgMatch = upper.match(/IMG\s*(\d+)/)
  const order = imgMatch ? Number(imgMatch[1]) : 1
  const rest = upper.replace(/IMG\s*\d+/, '').replace(/\s+/g, ' ').trim()
  let finish = null
  if (rest.startsWith('PRA') && rest.includes('FOSCO')) finish = 'prata-fosco'
  else if (rest === 'FOSCO') finish = 'fosco'
  else if (rest.startsWith('PRA')) finish = 'prata'
  else if (rest.startsWith('PRE')) finish = 'preto'
  else if (rest.startsWith('DOURADO')) finish = 'dourado'
  // "TUDO" (all finishes together) and a bare "IMG 2" are shared photos.
  return { finish, order }
}

async function listImages(dir) {
  return (await readdir(dir, { withFileTypes: true }))
    .filter((f) => f.isFile() && IMAGE_EXT.has(path.extname(f.name).toLowerCase()))
    .map((f) => f.name)
    .sort((a, b) => a.localeCompare(b, 'pt-BR'))
}

const stats = { photos: 0 }

async function writePhoto(input, id, name) {
  const target = path.join(OUT_IMG, id, `${name}.webp`)
  const info = await sharp(input).rotate()
    .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82 }).toFile(target)
  stats.photos++
  return { src: `/products/${id}/${name}.webp`, w: info.width, h: info.height }
}

// Square card image (600px) for one finish; cards swap between these when a color dot is tapped.
async function writeThumb(id, cover, key) {
  const file = `thumb-${key}.webp`
  await sharp(path.join(ROOT, 'public', cover.src))
    .resize({ width: 600, height: 600, fit: 'cover', position: 'attention' })
    .webp({ quality: 78 }).toFile(path.join(OUT_IMG, id, file))
  return `/products/${id}/${file}`
}

async function freshDir(id) {
  const dir = path.join(OUT_IMG, id)
  await rm(dir, { recursive: true, force: true })
  await mkdir(dir, { recursive: true })
}

// One folder = one product; file names pick the clasp finish.
async function buildGroupedProduct(folder, files, notes) {
  const dir = path.join(SOURCE, folder)
  const id = slug(folder)
  await freshDir(id)

  const byFinish = new Map()
  const shared = []
  for (const file of files) {
    const { finish, order } = parseFile(path.parse(file).name)
    if (!finish) notes.push(`${folder}/${file} (foto geral, usada em todos os acabamentos)`)
    const bucket = finish ? (byFinish.get(finish) ?? byFinish.set(finish, []).get(finish)) : shared
    bucket.push({ file, order })
  }

  const sharedPhotos = []
  for (const [i, s] of shared.sort((a, b) => a.order - b.order).entries()) {
    sharedPhotos.push(await writePhoto(path.join(dir, s.file), id, `geral-${i + 1}`))
  }
  const variants = []
  for (const f of FINISHES) {
    const list = byFinish.get(f.key)
    if (!list) continue
    const photos = []
    for (const [i, p] of list.sort((a, b) => a.order - b.order).entries()) {
      photos.push(await writePhoto(path.join(dir, p.file), id, `${f.key}-${i + 1}`))
    }
    variants.push({ key: f.key, label: f.label, photos: [...photos, ...sharedPhotos] })
  }
  if (variants.length === 0) variants.push({ key: 'unico', label: 'Único', photos: sharedPhotos })

  for (const v of variants) v.thumb = await writeThumb(id, v.photos[0], v.key)
  return [{ id, name: folder, series: seriesOf(folder), thumb: variants[0].thumb, variants }]
}

// One photo = one product, named "FOLDER FILE" (e.g. "ROLEX DIAMANTE BRANCO DOURADO").
async function buildSplitProducts(folder, files) {
  const dir = path.join(SOURCE, folder)
  const out = []
  for (const file of files) {
    const base = path.parse(file).name.replace(/\s+/g, ' ').trim()
    const name = `${folder} ${base}`
    const id = slug(name)
    await freshDir(id)
    const photo = await writePhoto(path.join(dir, file), id, '1')
    const upper = base.toUpperCase()
    const label = upper.includes('DOURADO') ? 'Dourado' : upper.includes('PRATA') ? 'Prata' : 'Único'
    const key = slug(label)
    const thumb = await writeThumb(id, photo, key)
    out.push({ id, name, series: seriesOf(folder), group: slug(folder), thumb, variants: [{ key, label, thumb, photos: [photo] }] })
  }
  return out
}

async function buildFolder(folder, notes) {
  const files = await listImages(path.join(SOURCE, folder))
  if (files.length === 0) return null
  return SPLIT_FOLDERS.has(folder.toLowerCase())
    ? buildSplitProducts(folder, files)
    : buildGroupedProduct(folder, files, notes)
}

const byName = (a, b) => a.name.localeCompare(b.name, 'pt-BR')

function report(products, extra = []) {
  console.log(`Fotos geradas: ${stats.photos} (+${products.length} miniaturas)`)
  for (const p of products) {
    console.log(`  ${p.name.padEnd(38)} ${p.series.padEnd(9)} ${p.variants.map((v) => `${v.label}:${v.photos.length}`).join('  ')}`)
  }
  for (const line of extra) console.log(line)
}

async function importAll() {
  const entries = await readdir(SOURCE, { withFileTypes: true })
  const folders = entries.filter((e) => e.isDirectory()).map((e) => e.name).sort((a, b) => a.localeCompare(b, 'pt-BR'))
  await rm(OUT_IMG, { recursive: true, force: true })
  await mkdir(OUT_IMG, { recursive: true })

  const catalog = []
  const skipped = []
  const notes = []
  for (const folder of folders) {
    if (SKIP_FOLDERS.has(folder.toLowerCase())) { skipped.push(`${folder} (ignorada)`); continue }
    const built = await buildFolder(folder, notes)
    if (!built) { skipped.push(`${folder} (sem fotos)`); continue }
    catalog.push(...built)
  }
  catalog.sort(byName)
  await writeFile(OUT_JSON, JSON.stringify(catalog, null, 2) + '\n')

  console.log(`Produtos no catálogo: ${catalog.length}`)
  report(catalog, [
    skipped.length ? `Pastas puladas: ${skipped.join(', ')}` : '',
    ...notes,
  ].filter(Boolean))
}

async function importOne(folder) {
  const exact = (await readdir(SOURCE, { withFileTypes: true }))
    .find((e) => e.isDirectory() && e.name.toLowerCase() === folder.toLowerCase())
  if (!exact) throw new Error(`pasta "${folder}" não encontrada em ${SOURCE}`)

  const current = JSON.parse(await readFile(OUT_JSON, 'utf8'))
  const groupSlug = slug(exact.name)
  // Drop this folder's previous products (grouped id or split products) and their images.
  const stale = current.filter((p) => p.id === groupSlug || p.group === groupSlug)
  for (const p of stale) await rm(path.join(OUT_IMG, p.id), { recursive: true, force: true })

  const notes = []
  const built = await buildFolder(exact.name, notes)
  if (!built) throw new Error(`a pasta "${exact.name}" não tem fotos`)

  const clash = built.find((b) => current.some((p) => p.id === b.id && !stale.includes(p)))
  if (clash) throw new Error(`o id "${clash.id}" já pertence a outro produto`)

  const catalog = current.filter((p) => !stale.includes(p)).concat(built).sort(byName)
  await writeFile(OUT_JSON, JSON.stringify(catalog, null, 2) + '\n')

  console.log(`Pasta "${exact.name}": ${built.length} produto(s) ${stale.length ? 'atualizados' : 'adicionados'}. Catálogo agora tem ${catalog.length}.`)
  report(built, notes)
}

;(ONLY ? importOne(ONLY) : importAll()).catch((err) => {
  console.error('Falha na importação:', err.message)
  process.exit(1)
})
