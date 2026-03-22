# Plano de Melhorias: Vitrine - Bibi Muniz e Ecossistema

## 🎯 Objetivo Final
Refinar a interface da vitrine, melhorando o layout e a experiência de rolagem, e usar este projeto para otimizar a skill `/stitch-frontend`, registrando o aprendizado para evitar bugs futuros.

## 📋 Tracks (Plano de Execução)

### Track -1: Implementar Logging em Tempo Real (Prioridade Máxima)
- **Descrição:** Acionar a skill `/skill-expert` para modificar o **Protocolo do Ecossistema** em todas as skills. A mudança consiste em adicionar a obrigação de registrar cada ação principal em um novo arquivo de log centralizado: `Resumo do projeto/log_execucao.txt`. A `/skill-expert` deverá ser a primeira a ser atualizada, para que possa então propagar a mudança para as demais.
- **Skill Responsável:** skill-expert
- **Dependências:** Nenhuma
- **Critério de Conclusão:** Todas as skills no diretório `.agent/skills/` terem seu `SKILL.md` atualizado com a nova regra de logging.
- **Status:** [ ] Não Iniciado

### Track 0: Corrigir Comportamento do /ceo-dodo
- **Descrição:** Acionar a skill `/skill-expert` (após sua própria atualização na Track -1) para editar o `SKILL.md` da skill `/ceo-dodo`. A meta é modificar a `Etapa 8 – Inicializar Infraestrutura do Projeto`, trocando a instrução de "criar ou resetar" para "criar ou anexar" e adicionando a regra de que `PLAN.md` e `registro_atividades.json` são históricos imutáveis.
- **Skill Responsável:** skill-expert
- **Dependências:** Track -1
- **Critério de Conclusão:** O `SKILL.md` da `/ceo-dodo` ter sido atualizado com a nova regra.
- **Status:** [ ] Não Iniciado

### Track 1: Otimizar Skill /stitch-frontend
- **Descrição:** Acionar a skill `/skill-expert` para criar um novo playbook na memória da `/stitch-frontend` com soluções para o bug de CSS `background-attachment: fixed` no mobile e boas práticas de estilização.
- **Skill Responsável:** skill-expert
- **Dependências:** Track 0
- **Critério de Conclusão:** A skill `/stitch-frontend` ter um novo arquivo em sua pasta `memory/` com as lições aprendidas.
- **Status:** [ ] Não Iniciado

### Track 2: Ajuste de Layout e Correção de Scroll
- **Descrição:** Acionar a `/stitch-frontend` (já otimizada) para aplicar os ajustes de layout e a correção do bug de scroll no projeto "Vitrine - Bibi Muniz".
- **Skill Responsável:** stitch-frontend
- **Dependências:** Track 1
- **Critério de Conclusão:** Os arquivos do projeto terem sido atualizados.
- **Status:** [ ] Não Iniciado

### Track 3: Deploy das Melhorias
- **Descrição:** Acionar a `/vercel-expert` para realizar o deploy da versão atualizada do projeto na Vercel.
- **Skill Responsável:** vercel-expert
- **Dependências:** Track 2
- **Critério de Conclusão:** O deploy ser concluído com sucesso.
- **Status:** [ ] Não Iniciado

---

## 📝 Log de Execução e Aprendizados
> Registro dos passos tomados nas melhorias.