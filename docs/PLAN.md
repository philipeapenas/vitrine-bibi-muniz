# PLANO DE PROJETO: VITRINE BIBI MUNIZ (V2)

## Phase 8: Presell Trust Redesign & Fast-Track Ban
O "Chairman" vetou o modo de bypass do CEO. A arquitetura foi restaurada para Delegação Estrita.

### Objetivos:
1. **CEO Compliance:** Remoção total do modo "Fast-Track" no sistema, forçando a delegação para operários técnicos.
2. **Confiança do Lead (Presell IG):** A página atual do Instagram destrói a confiança com copy amadora ("bloqueou nosso link"). Será regredida para uma cópia exata do modelo de referência `memory/presell-instagram.png` (Fundo azul escuro, modal branco suave, copy: "Click on continue to see bibimunizofc's page").
3. **Mágica do Redirect:** Criar a ilusão ou forçar o gatilho automático via Javascript para disparar a janela de verificação nativa do IG ("Esse link quer te tirar daqui") sem que o usuário precise engajar com um botão falso na presell.

## Phase 9: Implementação de Tracking (Supabase)
Implementação do sistema de tracking no frontend e tabelas do backend.
- [x] 1. Frontend: tracking.js para UTMs, Pageviews e Clicks.
- [x] 2. Backend: Supabase schemas para eventos e webhooks.

## Phase 10: Dashboard Visual (Supabase Analytics)
Criação de um painel de visualização em tempo real das métricas armazenadas no Supabase.
- [x] 1. Frontend-Expert: Criar a interface visual (ex: dashboard.html) com design premium da skill.
- [x] 2. Integração: Consumir os dados ao vivo usando a API REST nativa do Supabase (supabase-js ou Fetch API).

## Phase 11: Deploy de Produção (Admin GUI)
Subir as atualizações na Vercel para que o usuário possa testar e acessar o dashboard de administração online.
## Phase 12: Admin Security & Layout Fix
Correção da quebra de assets em prod (Vercel cleanUrls behavior) e adição de Basic Auth na rota `/admin`.
- [ ] 1. Stitch-Frontend/Fullstack: Alterar paths JS/CSS para absolutos em `/admin/index.html`.
- [ ] 2. Fullstack-Dev: Implementar Vercel Edge Middleware nativo (`middleware.js`) protegendo a rota `/admin` com Basic Auth.
