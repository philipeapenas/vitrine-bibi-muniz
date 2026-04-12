# Guia de Configuração dos Webhooks de Vendas

Para fechar o funil do tracking (Pageview -> Clique -> Compra), você precisa pegar os payloads gerados pelo sistema de vendas (`user_joined`, `payment_created`, `payment_approved`) e gravá-los no Supabase.

Nós criamos a tabela `transactions` no arquivo `supabase_setup.sql` que já está preparada para recebê-los.

## Caminho Ideal: Supabase Edge Functions (100% Nuvem, 24/7)

Como seu n8n é local, a melhor arquitetura técnica e mais escalável é usar **Supabase Edge Functions**. 
Elas são funções Serverless que rodam diretamente na infraestrutura global do seu Supabase. Elas ficam online 24/7 de forma extremamente barata e não dependem do seu notebook estar ligado.

Sua plataforma de pagamentos/bot enviará os webhooks diretamente para a URL dessa função, que capturará o JSON e fará a inserção (usando Service Role para burlar o RLS e escrever de forma segura) direto do lado da nuvem.

### 1. Código da Função
Já escrevi e criei a função para você! O código completo com as regras de extração do seu JSON foi salvo no seu projeto, em:
`supabase/functions/tracking-webhook/index.ts`

### 2. Como fazer o Deploy para a Nuvem
Você precisará utilizar o terminal do seu computador para jogar esse código para dentro do seu Supabase usando o CLI (ferramenta de linha de comando oficial):

1. **Faça o login na sua conta do Supabase:**
   ```bash
   npx supabase login
   ```
2. **Conecte seu diretório local com o projeto na nuvem** (Pegue o Seu Project ID nas configurações do projeto na dashboard):
   ```bash
   npx supabase link --project-ref SEU_PROJECT_ID
   ```
3. **Suba (Deploy) a sua função para a nuvem:**
   *(Usamos a flag `--no-verify-jwt` para que o Webhook externo de vendas não seja barrado pelo sistema de autenticação, já que sistemas de terceiros enviam POSTS simples)*
   ```bash
   npx supabase functions deploy tracking-webhook --no-verify-jwt
   ```

### 3. Configurando na sua Plataforma
Após o deploy, o seu terminal do Supabase CLI vai exibir a URL pública da sua Edge Function.
Geralmente o formato é:
`https://SEU_PROJECT_ID.supabase.co/functions/v1/tracking-webhook`

Vá até as configurações de Webhook do seu bot/PushinPay e adicione essa URL!

---

### A Magia do `click_id`
Como no tracking de frontend (JavaScript) nós salvamos todas as UTMs sob um determinado `click_id`, o Edge Function puxa nativamente o `tracking.click_id` que vem no Webhook de venda. Com isso, depois lá no painel, quando a transação for aprovada, basta cruzar os dados daquele `click_id` para ver extamente de que campanha/ad a pessoa veio.
