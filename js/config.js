/**
 * ═══════════════════════════════════════════════════════
 *  CONFIGURAÇÃO DA VITRINE DE LINKS
 *  Edite SOMENTE este arquivo para personalizar sua página.
 * ═══════════════════════════════════════════════════════
 */

const CONFIG = {
  // ─── Perfil ───────────────────────────────────────
  profileName: "Seu Nome ✨",
  bio: "Aqui é onde tem tudo o que você procura 💋",
  // foto usada na presell do Instagram (circular)
  profilePhoto: "assets/photos/profile.jpg",

  // ─── Redes Sociais ────────────────────────────────
  // Deixe null para esconder o ícone
  socials: {
    instagram: "https://www.instagram.com/seuperfil/",
    tiktok: "https://www.tiktok.com/@seuperfil",
  },

  // ─── Fotos de Fundo (Carrossel) ───────────────────
  // Coloque quantas quiser. Recomendado: 1080x1920 (portrait)
  backgroundPhotos: [
    "assets/photos/bg1.jpg",
    "assets/photos/bg2.jpg",
    "assets/photos/bg3.jpg",
    "assets/photos/bg4.jpg",
    "assets/photos/bg5.jpg",
  ],
  slideDuration: 4000, // milissegundos entre cada foto

  // ─── Links ────────────────────────────────────────
  links: [
    {
      title: "Mundinho secreto 🔞",
      url: "https://www.youtube.com/",
      icon: "link",       // "link" = ícone de corrente
      image: "assets/photos/card1.jpg",
    },
    // Para adicionar mais links, copie o bloco acima:
    // {
    //   title: "Outro Link 🔥",
    //   url: "https://exemplo.com",
    //   icon: "link",
    //   image: "assets/photos/card2.png",
    // },
  ],

  // ─── Pre-sell (Páginas de Ponte) ──────────────────
  presell: {
    instagram: {
      username: "seuperfil",
    },
    tiktok: {
      // Sem configurações extras por enquanto
    },
  },

  // ─── Cores ────────────────────────────────────────
  colors: {
    background: "#101010",
    text: "#ffffff",
    cardBlur: "20px",
  },
};
