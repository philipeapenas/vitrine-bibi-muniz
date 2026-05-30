# Análise do Painel Admin (Vitrine-Hot)

**Status Atual:** O painel (v5.0) opera atualmente sob um modelo "config-driven" dinâmico e multi-tenant lógico (por *slug* no banco de dados). Ele não trabalha com a separação física de arquivos/pastas.

## 1. Funcionalidades Atuais do /admin

O painel é uma Single Page Application (`app.js`, `index.html`, `style.css`, proxy `admin-client.js`) protegido por um login e interceptado no backend via `/api/admin/db.js` e `/api/admin/storage.js`. Suas principais abas e funcionalidades são:

### A. Gestão Multi-Model Lógica (Dropdown)
- **Seleção Dinâmica:** Um seletor de "Modelo" no topo que troca o contexto do admin (`currentModelSlug`).
- **Criação Rápida:** Botão "Nova Modelo" que insere uma linha mínima na tabela `site_profile` com um novo slug, disponibilizando-o para edição.

### B. Dashboard / Analítico
- Consulta dados em tempo real nas tabelas `tracking_events` e `transactions` filtradas por `model_slug`.
- Exibe KPIs desduplicados (Pageviews, Cliques em Ofertas, PIX Gerados, Vendas Aprovadas) com filtros de data (Hoje, Ontem, Semana, Mês, Custom).
- Tabela de histórico de ações (Quem clicou, quem gerou pix, quem pagou) mesclando tracking e status de checkout.

### C. Identidade & Perfil
- Edição dos dados da modelo salvos em `site_profile`: Nome, Username, Localização, Insta, Pixel FB, Bios (Curta e Longa), e "Estatísticas Fakes" do Feed (Likes, Posts, etc).
- Configuração de um **Deploy Hook da Vercel** independente por modelo.
- Upload de Foto de Perfil e Banner, que vão para o bucket unificado `site_assets`.

### D. Pós-Venda (Página de Obrigado)
- Personalização de Headline, Mensagem de sucesso, e texto/URL do botão VIP (Telegram/WhatsApp) que são consumidos dinamicamente pela página de obrigado.

### E. Planos & Checkout (Ofertas)
- CRUD (Criar, Editar, Apagar) de planos salvos na tabela `site_offers`.
- Configuração de ID único, Nome, URL do gateway (PushinPay), Preço, e Flags de promoção.
- Ordenação por data de criação e flag de ativo/inativo.

### F. Vitrine (Links e Carrossel)
- **Botões/Links:** CRUD na tabela `site_links` com interface drag-and-drop (SortableJS) para ordenação, e toggle de "animação de atenção" (Pulse).
- **Carrossel de Fotos:** Upload múltiplo de mídias (fundo embaçado), salvas em `carousel_photos` no banco e armazenadas no bucket `site_assets`, com ordenação visual também via SortableJS.

### G. Segurança
- Login front-end pede a senha (`ADMIN_PASSWORD`), que é armazenada na `sessionStorage`.
- As requisições usam endpoints da pasta `/api/admin/` como proxy para o PostgREST, o que garante que a Service Key não vaze no front-end. O back-end possui uma Allowlist (pode alterar Perfis/Links, mas só ler Transações).

---

## 2. O que NÃO FUNCIONA MAIS na Nova Visão (Multi-Tenant por Pastas)

A nova visão exige que cada modelo tenha uma **pasta própria** (ex: `[raiz]/modelo_1/vitrine.html`, `checkout.html`, etc.), separando o projeto fisicamente. Os conflitos são:

1. **Roteamento e Arquitetura de Pastas vs Banco Centralizado:**
   - Atualmente, o frontend (como `checkout.html` na raiz) pergunta para a API (ex: `checkout-config.js`) os dados baseados na URL/Slug.
   - O Admin edita tudo em um banco de dados relacional. Se vamos ter *pastas por modelo* contendo arquivos físicos independentes de HTML/Links/Checkout, o admin teria que: 
     a) Ou **gerar/modificar esses arquivos** localmente (escrever no disco e commitar), o que a API atual do Supabase *não* faz.
     b) Ou o projeto precisa adotar um formato de Static Site Generation (SSG) no momento do Vercel Deploy (onde as pastas são geradas dinamicamente via script de build lendo do Supabase).
   - O sistema atual não constrói arquivos soltos em pastas, ele apenas muda dados num banco.

2. **Deploy Hook Único/Geral:**
   - O admin possui um campo "Vercel Deploy Hook" na tabela do banco. Se as pastas pertencerem a um único repositório massivo, o deploy de uma modelo republicaria a Vercel para todas as modelos de uma vez, podendo ser custoso ou gerar cache issues.

3. **Gerenciamento de Assets:**
   - O upload no admin joga arquivos soltos na raiz do bucket `site_assets` ou na subpasta `carousel/`. Não há um namespace físico forte no storage para isolar 100% as mídias da "Modelo 1" das da "Modelo 2".

4. **Isolamento de Segurança:**
   - O `/admin` atual enxerga os dados de *todas* as modelos porque a API permite select global. Se for haver sub-admins para a própria modelo gerenciar sua página (no futuro), a lógica atual vaza o acesso.

---

## 3. Recomendações para a Refatoração

Para alinhar com a nova arquitetura "Pastas de Modelo":

- **Gerador de Sites Estáticos (SSG):** Em vez de reescrever o admin para gerar arquivos (lidar com `fs.writeFile`), a melhor abordagem é manter o admin escrevendo no Supabase, mas alterar o processo de *build* do projeto (Vercel) ou rodar um script Node local para que ele baixe os dados do Supabase e **gere fisicamente as pastas de cada modelo** antes de subir pro ar.
- **Estruturação de Assets:** Alterar o `api/admin/storage.js` para salvar obrigatoriamente os arquivos dentro do path da modelo (ex: `site_assets/modelo_slug/profile.png`), garantindo isolamento total.
- **Middleware / Roteamento:** Se as pastas forem independentes, os links e rotas precisam ser relativos ou gerados estaticamente para cada pasta. O `middleware.js` precisa ser desativado ou refeito para rotear as pastas corretamente sem quebrar os caminhos (ex: `/modelo1/checkout.html`).
