# GM NICHE

Site da marca GM NICHE: pulseiras em edição limitada compatíveis com WHOOP 4.0 e MG, com carrinho de compras.

## Rodar no computador

```bash
npm install
npm run dev
```

Abre em http://localhost:5173.

## Gerar a versão final para publicar

```bash
npm run build
```

Os arquivos ficam na pasta `dist/`. Suba essa pasta na Vercel, Netlify ou qualquer hospedagem estática.

## O que trocar antes de publicar

- **Pagamento**: `src/data/products.js`, constante `CHECKOUT_URL`. Enquanto estiver vazia, o botão de finalizar compra fica desativado.
- **Packs**: lista `packs` em `src/data/products.js`.
- **Dúvidas frequentes**: lista `faqs` no mesmo arquivo.
- **Produtos e fotos**: coloque as fotos em uma pasta por produto e rode `node scripts/import-products.mjs "C:\caminho\FOTOS WHOOP"`. O nome da pasta vira o nome do produto. O nome de cada foto define o acabamento do fecho (PRATA, PRATA FOSCO, PRETO, FOSCO, DOURADO); fotos com IMG 2, IMG 3 entram na galeria do mesmo acabamento. O script gera `public/products/` e `src/data/catalog.json`.
- **Preço, estoque e compatibilidade**: `DEFAULT_PRICE`, `DEFAULT_STOCK` e `COMPATIBILITY` em `src/data/products.js`.
- **Logo**: `public/logo.png`. O arquivo original fica em `brand/`.
- **Redes sociais e páginas de política**: links no rodapé em `src/App.jsx`, função `Footer`.
- **Textos**: `src/App.jsx`, cada seção é uma função com o texto dentro.

## Tecnologias

- React + Vite
- Three.js com React Three Fiber e Drei (instalado, mas não usado mais pelo site)
- Fonte Montserrat via Google Fonts
