# Vitrine de Links — Réplica do gaml.ai/bibimunizofc

Replicar o site de links da referência como uma página 100% estática (HTML + CSS + JS), com total autonomia de configuração (fotos, links, textos, cores) via um arquivo de configuração JSON ou variáveis JS simples.

## Análise Técnica da Referência

A análise do site original revelou:

| Aspecto | Detalhe |
|---|---|
| **Framework** | React (`LandingPage` component, template `slider`) |
| **Fonte** | Google Fonts — **Inter** |
| **Fundo** | 5 imagens full-screen em carrossel com **fade**, barras de progresso estilo Stories |
| **Layout** | Mobile-first, centralizado, máx. ~480px no desktop |
| **Card de Link** | Estilo **glassmorphism** (`backdrop-filter: blur`), imagem de fundo + ícone + texto |
| **Identidade** | Nome + bio + ícones sociais (Instagram, TikTok) |
| **Pre-sell** | Páginas separadas para Instagram (botão "Continue") e TikTok (tutorial "Abrir no navegador") |
| **Cor de fundo** | `#101010` (quase preto) |

---

## Proposed Changes

### Estrutura de Arquivos

```
c:\philipe\Ferramentas\Vitrine De Links\
├── index.html          ← Página principal + detecção de User-Agent
├── style.css           ← Todo o design system
├── script.js           ← Carrossel, progress bars, UA detection, redirect
├── config.js           ← Configuração editável (nome, bio, fotos, links)
├── presell-instagram.html  ← Pre-sell para navegador do Instagram
├── presell-tiktok.html     ← Pre-sell para navegador do TikTok
├── assets/
│   └── photos/         ← Fotos do usuário (background + card)
└── Referencia/         ← Já existente, prints de referência
```

---

### Core — Configuração

#### [NEW] [config.js](file:///c:/philipe/Ferramentas/Vitrine%20De%20Links/Vitrine%20-%20Bibi%20Muniz/config.js)

Arquivo de configuração central que o usuário edita para personalizar tudo:

```js
const CONFIG = {
  profileName: "Seu Nome ✨",
  bio: "Sua bio aqui 💋",
  profilePhoto: "assets/photos/profile.jpg",
  
  socials: {
    instagram: "https://instagram.com/seuperfil",
    tiktok: "https://tiktok.com/@seuperfil",
  },
  
  backgroundPhotos: [
    "assets/photos/bg1.jpg",
    "assets/photos/bg2.jpg",
    "assets/photos/bg3.jpg",
  ],
  slideDuration: 4000,  // ms entre cada foto
  
  links: [
    {
      title: "Mundinho secreto 🔞",
      url: "https://seu-link-destino.com",
      icon: "🔗",
      image: "assets/photos/card1.jpg",
    },
  ],
  
  presell: {
    instagram: {
      profilePhoto: "assets/photos/profile.jpg",
      username: "seuperfil",
      redirectUrl: null,  // null = vai pra index.html
    },
    tiktok: {
      redirectUrl: null,
    },
  },
  
  colors: {
    background: "#101010",
    text: "#ffffff",
    cardBg: "rgba(255,255,255,0.08)",
    cardBlur: "16px",
  },
};
```

> [!TIP]
> O usuário só precisa editar este arquivo para trocar fotos, links, nome, bio — sem mexer em HTML/CSS.

---

### Front-end — Página Principal

#### [NEW] [index.html](file:///c:/philipe/Ferramentas/Vitrine%20De%20Links/Vitrine%20-%20Bibi%20Muniz/index.html)

Estrutura HTML semântica mobile-first:

- **`<head>`**: Meta viewport, OG tags, Google Fonts (Inter), link para `style.css`
- **`<div id="slideshow">`**: Container para imagens de fundo full-screen com fade
- **`<div id="progress-bars">`**: Barras de progresso estilo Stories no topo
- **`<main class="content">`**: 
  - Foto de perfil (circular, opcional, pode omitir para ficar igual à ref)
  - Nome em destaque (`<h1>`)
  - Bio (`<p>`)
  - Ícones sociais (Instagram + TikTok, SVG inline)
  - Cards de links com glassmorphism
- **`<script src="config.js">`** + **`<script src="script.js">`**

#### [NEW] [style.css](file:///c:/philipe/Ferramentas/Vitrine%20De%20Links/Vitrine%20-%20Bibi%20Muniz/style.css)

Design system completo:

1. **Reset + Base**: `box-sizing`, font Inter, `background-color: #101010`, `color: #fff`
2. **Layout Container**: `max-width: 480px`, centralizado, `min-height: 100vh`
3. **Background Slideshow**: 
   - Imagens `position: fixed`, `object-fit: cover`, 100vw/100vh
   - Transição de `opacity` 0→1 com `transition: opacity 1s ease`
   - Overlay escuro semi-transparente (`rgba(0,0,0,0.3)`) para legibilidade
4. **Progress Bars (Stories)**: 
   - `display: flex`, barras horizontais no topo, `height: 3px`
   - Barra ativa preenche progressivamente com animação CSS (`@keyframes progressFill`)
   - Cor branca com opacidade
5. **Perfil Section**: Nome em `font-weight: 800`, tamanho grande, bio em peso normal
6. **Social Icons**: SVGs de Instagram e TikTok, `width: 28px`, com hover sutil
7. **Link Cards (Glassmorphism)**:
   - `backdrop-filter: blur(16px)`, `background: rgba(255,255,255,0.08)`
   - `border: 1px solid rgba(255,255,255,0.12)`, `border-radius: 16px`
   - Imagem de fundo do card com `object-fit: cover`
   - Ícone de link + título sobrepostos
   - Hover com `scale(1.02)` e brilho sutil
8. **Responsivo**: No desktop, layout centralizado com fundo escuro/blur nas laterais

#### [NEW] [script.js](file:///c:/philipe/Ferramentas/Vitrine%20De%20Links/Vitrine%20-%20Bibi%20Muniz/script.js)

Lógica principal:

1. **Background Slideshow Engine**:
   - Pré-carrega todas as imagens do `CONFIG.backgroundPhotos`
   - Troca de imagens a cada `CONFIG.slideDuration`ms com transição fade
   - Atualiza as progress bars sincronizadamente
   - Loop infinito

2. **Progress Bars**:
   - Cria uma barra para cada foto dinamicamente
   - Barra ativa anima de 0% a 100% no tempo do slide
   - Barras anteriores ficam preenchidas, próximas ficam vazias

3. **User-Agent Detection**:
   - Detecta `Instagram` no User-Agent → redireciona para `presell-instagram.html`
   - Detecta `TikTok` ou `ByteDance` ou `musical_ly` → redireciona para `presell-tiktok.html`
   - Navegador normal → mostra a página principal

4. **Link Tracking** (opcional):
   - Ao clicar em um link, pode registrar o clique via `navigator.sendBeacon` ou similar

---

### Pre-sell Pages

#### [NEW] [presell-instagram.html](file:///c:/philipe/Ferramentas/Vitrine%20De%20Links/Vitrine%20-%20Bibi%20Muniz/presell-instagram.html)

Página exibida quando o usuário acessa pelo navegador in-app do Instagram:

- Fundo escuro/roxo (#0a0a2e)
- Card centralizado branco com:
  - Foto de perfil circular
  - Texto: "Click on continue to see **username**'s page"
  - Botão azul "Continue" → redireciona para `index.html` (ou link final)
- Minimalista, serve como "filtro humano"

#### [NEW] [presell-tiktok.html](file:///c:/philipe/Ferramentas/Vitrine%20De%20Links/Vitrine%20-%20Bibi%20Muniz/presell-tiktok.html)

Página exibida quando o usuário acessa pelo navegador in-app do TikTok:

- Fundo branco/claro com ilustração de mão apontando (CSS puro ou emoji)
- Título grande: "Para acessar o link, siga estas 2 etapas simples:"
- Passo 1: 👆 "Clique no menu ··· no canto superior direito"
- Passo 2: 📱 'Selecione "Abrir no navegador"'
- Layout limpo e instrucional

---

### Diretório de Assets

#### [NEW] `assets/photos/` 

Diretório onde o usuário coloca suas fotos. Inicialmente vazio, com um `README.md` explicando os formatos esperados:
- `bg1.jpg`, `bg2.jpg`, etc. — fotos de fundo (recomendado: 1080x1920, portrait)
- `card1.jpg` — imagem do card de link
- `profile.jpg` — foto de perfil (opcional)

---

## Verification Plan

### Testes no Navegador (Browser)

1. **Desktop**: Abrir `index.html` no navegador e verificar:
   - Carrossel de fundo funcionando com fade + progress bars
   - Layout centralizado com max-width
   - Card de link com glassmorphism visível
   - Ícones sociais clicáveis
   
2. **Mobile (DevTools)**: Abrir DevTools (F12) → toggle device toolbar → simulação mobile:
   - Layout full-width no mobile
   - Fotos ocupando tela toda
   - Toques nos links funcionando

3. **User-Agent Test**: Mudar o User-Agent no DevTools para `Instagram` e recarregar → deve redirecionar para `presell-instagram.html`. Repetir com `TikTok`.

### Comparação Visual

Comparação lado a lado com os screenshots de referência em `Referencia/`:
- [front-end-mobile.png](file:///c:/philipe/Ferramentas/Vitrine%20De%20Links/Vitrine%20-%20Bibi%20Muniz/Referencia/front-end-mobile.png) vs implementação mobile
- [front-end-desktop.png](file:///c:/philipe/Ferramentas/Vitrine%20De%20Links/Vitrine%20-%20Bibi%20Muniz/Referencia/front-end-desktop.png) vs implementação desktop
- [presell-instagram.png](file:///c:/philipe/Ferramentas/Vitrine%20De%20Links/Vitrine%20-%20Bibi%20Muniz/Referencia/presell-instagram.png) vs `presell-instagram.html`
- [presell-tiktok.png](file:///c:/philipe/Ferramentas/Vitrine%20De%20Links/Vitrine%20-%20Bibi%20Muniz/Referencia/presell-tiktok.png) vs `presell-tiktok.html`
