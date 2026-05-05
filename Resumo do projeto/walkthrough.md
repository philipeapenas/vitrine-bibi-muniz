# Vitrine de Links — Walkthrough

## O que foi implementado

Réplica completa do site [gaml.ai/bibimunizofc](https://gaml.ai/bibimunizofc) com **100% de autonomia** sobre todos os conteúdos.

### Resultados Visuais

````carousel
![Desktop — layout centralizado com fundo blur nas laterais](C:\Users\luizp\.gemini\antigravity\brain\25e32f29-9c09-4a3c-b238-5e449b083647\desktop_view.png)
<!-- slide -->
![Mobile — layout fullscreen com progress bars, perfil e card glassmorphism](C:\Users\luizp\.gemini\antigravity\brain\25e32f29-9c09-4a3c-b238-5e449b083647\mobile_view.png)
````

### Gravação do Slideshow

![Demonstração do carrossel de fundo com transição fade e progress bars](C:\Users\luizp\.gemini\antigravity\brain\25e32f29-9c09-4a3c-b238-5e449b083647\main_page_test_1773950429411.webp)

---

## Arquivos Criados

| Arquivo | Função |
|---|---|
| [config.js](file:///c:/philipe/Ferramentas/Vitrine%20De%20Links/Vitrine%20-%20Bibi%20Muniz/config.js) | **Único arquivo que você edita** — nome, bio, fotos, links, cores |
| [index.html](file:///c:/philipe/Ferramentas/Vitrine%20De%20Links/Vitrine%20-%20Bibi%20Muniz/index.html) | Página principal com slideshow + perfil + cards |
| [style.css](file:///c:/philipe/Ferramentas/Vitrine%20De%20Links/Vitrine%20-%20Bibi%20Muniz/style.css) | Design system completo (glassmorphism, animações, responsivo) |
| [script.js](file:///c:/philipe/Ferramentas/Vitrine%20De%20Links/Vitrine%20-%20Bibi%20Muniz/script.js) | Motor JS: carrossel, progress bars, detecção de User-Agent |
| [presell-instagram.html](file:///c:/philipe/Ferramentas/Vitrine%20De%20Links/Vitrine%20-%20Bibi%20Muniz/presell-instagram.html) | Página de ponte para Instagram (botão "Continue") |
| [presell-tiktok.html](file:///c:/philipe/Ferramentas/Vitrine%20De%20Links/Vitrine%20-%20Bibi%20Muniz/presell-tiktok.html) | Página de ponte para TikTok (tutorial "Abrir no navegador") |

---

## Como Personalizar

Abra o [config.js](file:///c:/philipe/Ferramentas/Vitrine%20De%20Links/Vitrine%20-%20Bibi%20Muniz/config.js) e edite:

```js
// Troque o nome e bio
profileName: "Seu Nome ✨",
bio: "Sua bio aqui 💋",

// Troque as fotos de fundo (coloque quantas quiser)
backgroundPhotos: [
  "assets/photos/bg1.png",  // substitua por suas fotos
  "assets/photos/bg2.png",
  "assets/photos/bg3.png",
],

// Troque o link de destino
links: [
  {
    title: "Mundinho secreto 🔞",
    url: "https://www.youtube.com/",  // seu link aqui
    image: "assets/photos/card1.png", // imagem do card
  },
],
```

> [!TIP]
> As fotos de fundo ficam em `assets/photos/`. Basta substituir os arquivos `bg1.png`, `bg2.png`, etc. pelas suas fotos reais. Recomendado: 1080x1920 (portrait).

---

## Verificação

- ✅ **Desktop**: Layout centralizado com blur escuro nas laterais
- ✅ **Mobile**: Fullscreen com fotos ocupando toda a tela
- ✅ **Slideshow**: Transição fade suave entre fotos (4s por foto)
- ✅ **Progress bars**: Estilo Stories sincronizado com o carrossel
- ✅ **Glassmorphism**: Card com blur + transparência
- ✅ **Social icons**: Instagram e TikTok com hover interativo
- ✅ **User-Agent detection**: Redirect automático para presell pages
- ✅ **Presell Instagram**: Card branco com foto + botão "Continue"
- ✅ **Presell TikTok**: Tutorial com passos + ilustração animada
