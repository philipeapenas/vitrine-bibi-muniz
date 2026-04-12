/**
 * ═══════════════════════════════════════════════════════
 *  CONFIGURAÇÃO DA VITRINE DE LINKS
 *  Edite SOMENTE este arquivo para personalizar sua página.
 * ═══════════════════════════════════════════════════════
 */

const CONFIG = {
  // ─── Perfil ───────────────────────────────────────
  profileName: "Bibi Muniz ✨",
  bio: "Aqui é onde tem tudo o que você procura 💋",
  // foto usada na presell do Instagram (circular)
  profilePhoto: "assets/photos/profile.jpg",

  // ─── Redes Sociais ────────────────────────────────
  // Deixe null para esconder o ícone
  socials: {
    instagram: "https://www.instagram.com/bibimunizz021/",
    tiktok: null,
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
      title: "Cantinho secreto 🔞",
      url: "https://apextry.com/go/bibimunizzofc",
      icon: "link",
      image: "assets/photos/card1.jpg",
      trackCode: "insta_bio"
    },
    {
      title: "Acesso Direto 🔥",
      url: "checkout.html",
      icon: "link",
      image: "assets/photos/card1.jpg", // Troque por card2.jpg quando tiver a imagem
      trackCode: "checkout_direto"
    },
  ],

  // ─── Pre-sell (Páginas de Ponte) ──────────────────
  presell: {
    instagram: {
      username: "bibimunizz021",
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
