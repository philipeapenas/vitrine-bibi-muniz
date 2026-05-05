# Vitrine - Bibi Muniz

Projeto estruturado utilizando padrões Vanilla JS ideais para deploy rápido na Vercel (HTML/CSS/JS puros).

## Estrutura Otimizada
- `index.html`: Página principal e ponto de entrada configurado via Vercel.
- `css/`: Estilos centralizados.
- `js/`: Scripts globais e lógicas de interface (`config.js`, `script.js`).
- `assets/`: Midias organizadas em cache longo via cabeçalhos definidos.

## Executando Localmente
Abra a pasta deste projeto e inicie um servidor HTTP simples ou utilize a extensão Live Server no VSCode. Exemplo com python:
```bash
python -m http.server 3000
```
Você poderá visualizar o projeto em `http://localhost:3000`.

## Vercel Deploy
O repositório está pronto para a web, com URLs limpas (`cleanUrls`) e politicas de cache rígidas em `.json`.
Para fazer deploy pela CLI:
```bash
vercel --prod
```
