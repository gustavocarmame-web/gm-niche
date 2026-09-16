# GM NICHE

Site da marca GM NICHE: bandas em edição limitada compatíveis com WHOOP 4.0 e MG. Pedido pelo WhatsApp, sem carrinho.

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

- **Número do WhatsApp**: `src/data/products.js`, constante `WHATSAPP_NUMBER`. Só dígitos, com DDI e DDD. Exemplo: `5511999998888`.
- **Modelos, cores e preços**: mesma pasta, lista `products`. A cor `color` é a cor da banda no 3D e `clasp` é a cor do fecho. `stock: 0` marca como esgotado.
- **Packs**: lista `packs` no mesmo arquivo.
- **Dúvidas frequentes**: lista `faqs` no mesmo arquivo.
- **Fotos dos produtos**: `public/bands/<id>.webp`, geradas a partir do modelo 3D. Ao criar um modelo novo, adicione uma foto com o mesmo `id`.
- **Logo**: `public/logo.png`. O arquivo original fica em `brand/`.
- **Redes sociais e páginas de política**: links no rodapé em `src/App.jsx`, função `Footer`.
- **Textos**: `src/App.jsx`, cada seção é uma função com o texto dentro.

## Tecnologias

- React + Vite
- Three.js com React Three Fiber e Drei (banda em 3D, carregada só quando aparece na tela)
- Fonte Montserrat via Google Fonts
