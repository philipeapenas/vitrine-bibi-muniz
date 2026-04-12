# Tracking System Design

## 1. Arquitetura Geral da Solução

A solução será baseada em uma arquitetura de coleta de dados no client-side (Frontend) combinada com armazenamento em tempo real no Supabase, além da recepção dos webhooks de vendas/leads informados.

- **Frontend (Vitrine):** Módulo Vanilla JS (`tracking.js`) que atua como um "espião", capturando parâmetros da URL (UTMs), armazenando na sessão e disparando eventos no Supabase.
- **Backend (Supabase):** Banco de dados centralizado e real-time (PostgreSQL). Tabelas dedicadas com políticas de segurança (RLS - Row Level Security) permitindo apenas inserções (Insert-Only) a partir da web.

## 2. Componentes Principais e Responsabilidades

### A. Módulo de Frontend (`tracking.js`)

- **UTM Catcher:** Lê `?utm_source=...` da URL na chegada do usuário e salva no `localStorage` para não perder a origem se ele navegar por outras páginas antes de clicar.
- **Pageview Tracker:** Dispara um evento de _pageview_ assim que o site carrega, enviando os dados básicos (User Agent, URL atual e as UTMs salvas).
- **Click Interceptor:** Adiciona _listeners_ nos botões/links da vitrine. Ao usuário clicar, envia um evento de _click_ antes de redirecioná-lo. (Isso permite calcular o CTR: Cliques / Pageviews).

### B. Banco de Dados (Supabase)

- **Tabela `tracking_events`:** Recebe os pageviews e clicks do frontend.
  - Colunas: `id`, `event_type` ('pageview', 'click'), `session_id`, `utm_source`, `utm_campaign`, `utm_medium`, `url`, `created_at`.
- **Tabela `transactions` e `customers`:** Estruturas preparadas para receber os payloads dos webhooks (`user_joined`, `payment_created`, `payment_approved`).

### C. Camada de Webhooks (Supabase Edge Functions)

- Endpoint ou Edge Function para receber o POST dos webhooks de pagamentos e atualizar o status financeiro do lead no Supabase, cruzando com os `click_id` / `UTMs` capturados pelo frontend.

## 3. Tecnologias Envolvidas

- **Linguagem Frontend:** Vanilla JavaScript (leve e não afeta o tempo de carregamento da vitrine).
- **Armazenamento de Sessão:** `localStorage` (Armazenamento persistente das UTMs).
- **Backend / Real-time Database:** Supabase (Database PostgreSQL + API REST nativa).
- **Comunicação:** Supabase JS Client (chamadas diretas seguras via RLS) ou Fetch API.

## 4. Dashboard Visual (Frontend-Expert)

- **Objetivo**: Renderizar em tempo real as métricas do Supabase para visualização gerencial.
- **Métricas Exibidas**:
  - Leads Iniciados (`user_joined`) por dia
  - Pagamentos Criados por dia
  - Pagamentos Aprovados por dia
  - Origem do Lead (UTM/`?code=`) por dia
  - Pageviews na Vitrine
  - CTR% (Cliques / Pageviews)
- **Design/UI**: Utilizar a skill `frontend-expert` para garantir um visual "premium" moderno (Vanilla JS, CSS robusto). O painel deve ter estética **minimalista**, abolindo o padrão glass, focando em usabilidade e usando **cores semânticas** para diferenciar o status das métricas. HTML/CSS/JS puros serão suficientes e manterão a performance.

## 5. Segurança Oculta (Edge Middleware)
- Proteção da rota `/admin` contra visitantes utilizando `middleware.js` (Basic Auth via headers) e interceptação na Edge Network da Vercel.
