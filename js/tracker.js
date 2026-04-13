(function () {
  "use strict";

  // Configuração Supabase
  const SUPABASE_URL = "https://mdmjyvxrozxrxwmasnuq.supabase.co"; 
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kbWp5dnhyb3p4cnh3bWFzbnVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzMTExNjgsImV4cCI6MjA4OTg4NzE2OH0.1gLdW8hohxALfDd2kthsJHqPjTbztgleGizJE7IcBbU"; 

  // --- MOTOR DE ATRIBUIÇÃO UTM ---
  function getUTMs() {
    const urlParams = new URLSearchParams(window.location.search);
    const utms = {
      utm_source: urlParams.get('utm_source'),
      utm_medium: urlParams.get('utm_medium'),
      utm_campaign: urlParams.get('utm_campaign'),
      utm_term: urlParams.get('utm_term'),
      utm_content: urlParams.get('utm_content'),
      utm_id: urlParams.get('utm_id'),
      src: urlParams.get('src')
    };

    // Filtra nulos
    Object.keys(utms).forEach(key => utms[key] === null && delete utms[key]);

    // Persistência "Last Click"
    if (Object.keys(utms).length > 0) {
      localStorage.setItem("dodo_utms", JSON.stringify(utms));
      return utms;
    }

    // Se não tem na URL, tenta pegar do localStorage
    const stored = localStorage.getItem("dodo_utms");
    return stored ? JSON.parse(stored) : {};
  }

  const currentUtms = getUTMs();

  // Gera um session_id único (se não existir)
  let sessionId = localStorage.getItem("vitrine_session_id");
  if (!sessionId) {
    sessionId = (Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15));
    localStorage.setItem("vitrine_session_id", sessionId);
  }

  // Gera um click_id único para esta sessão (para cruzamento com transactions)
  let clickId = localStorage.getItem("vitrine_click_id");
  if (!clickId) {
    clickId = (Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15));
    localStorage.setItem("vitrine_click_id", clickId);
  }

  // --- INTEGRACAO FACEBOOK PIXEL ---
  let fbPixelId = null;

  function initFBPixel(id) {
    if (!id || fbPixelId) return;
    fbPixelId = id;
    
    !(function (f, b, e, v, n, t, s) {
      if (f.fbq) return;
      n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = !0;
      n.version = "2.0";
      n.queue = [];
      t = b.createElement(e);
      t.async = !0;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");

    fbq("init", id);
    fbq("track", "PageView");
    console.log("Tracker: FB Pixel Initialized (" + id + ")");
  }

  // API Global do Tracker
  window.DodoTracker = {
    capture: async function(eventType, extraPayload = {}) {
      const payload = {
        event_type: eventType,
        session_id: sessionId,
        url: window.location.href,
        user_agent: navigator.userAgent,
        click_id: clickId,
        ...currentUtms,
        ...extraPayload
      };

      // 1. Enviar para Supabase
      try {
        fetch(`${SUPABASE_URL}/rest/v1/tracking_events`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
            "Prefer": "return=minimal"
          },
          body: JSON.stringify(payload)
        });
      } catch (e) {
        console.error("Tracker: Erro Supabase", e);
      }

      // 2. Disparar FB Pixel (se disponível)
      if (window.fbq) {
        const fbEventMap = {
          'pageview': 'PageView',
          'click_checkout': 'InitiateCheckout',
          'purchase': 'Purchase'
        };
        const fbEventName = fbEventMap[eventType] || eventType;
        
        const fbParams = {};
        if (eventType === 'purchase' && extraPayload.value) {
            fbParams.value = extraPayload.value / 100;
            fbParams.currency = 'BRL';
        }

        fbq('trackCustom', fbEventName, fbParams);
      }
    },
    setPixel: function(id) {
        initFBPixel(id);
    },
    getUTMs: function() {
        return getUTMs();
    }
  };

  // --- AUTOMATISMOS ---

  // 1. Pageview
  window.DodoTracker.capture("pageview");

  // 2. Click Interceptor
  document.addEventListener("click", function (e) {
    const targetLink = e.target.closest("a");
    if (!targetLink || !targetLink.href) return;

    let clickType = "link";
    let eventName = "click";

    // Lógica específica solicitada (Cantinho Secreto vs Privacy)
    if (targetLink.id === 'link-1' || targetLink.href.includes("apextry.com")) {
        clickType = "cantinho_secreto";
        eventName = "click_segredo";
    } else if (targetLink.href.includes("checkout.html") || targetLink.classList.contains("link-card")) {
        clickType = "checkout_privacy";
        eventName = "user_checkout"; // Renomeado para alinhar com o dashboard
    } else if (targetLink.classList.contains("social-icon")) {
        clickType = "social";
    }

    // Captura Sale Code dinâmico do atributo (injetado pelo script.js) com fallback para utm_term da URL
    const saleCode = targetLink.getAttribute('data-sale-code');
    const extraPayload = { 
      clicked_url: targetLink.href,
      click_type: clickType,
      utm_term: saleCode || currentUtms.utm_term || 'organico'
    };

    window.DodoTracker.capture(eventName, extraPayload);
  });

  // 3. Tenta carregar o Pixel do config inicial (se existir)
  // Nota: O checkout.html e index.html chamarão DodoTracker.setPixel(id) após carregar o site_profile
})();

