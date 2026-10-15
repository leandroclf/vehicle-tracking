# Objective

Concluir a correção determinística do lockfile preparada pelo host, atualizar pontualmente o README e exigir validação e revisão do diff completo desde 43cd73e423c25e20ebe0c25c0dd094a199c87648, sem migração ou deploy.

## Original request

Consolidar a correção determinística do lockfile já preparado pelo host, documentar sua reprodução e validar a instalação e aplicação sem deploy.

Execute apenas a tarefa definida no envelope congelado em /handoff/proposal.json no repositório desta tarefa. O operador autorizou esta rodada e o host registrou danger-full-access como sandbox Codex dentro do container; isso não autoriza ampliar permissões, copiar credenciais ou sair do produto. Leia AGENTS.md, regras em /handoff/rules/, rules.json e capabilities.json. No plano, capability_decisions deve ser exatamente igual ao handoff. Use REUSE, sem criar capacidades ou copiar código de outro produto.
Antes de editar, leia os arquivos de escopo e todos os chamadores relevantes; estabeleça o contrato pretendido e a baseline. Para APIs, reuse OpenAPI/coleções existentes. Escreva uma regressão pequena para nova lógica não trivial. Faça a menor correção completa, sem dependências novas, refatorações adjacentes, skip novo ou supressões para obter verde. Respeite os critérios do envelope mesmo quando houver menos asserções nos testes atuais.
Argus usa somente ferramentas de arquivo. O host executa comandos, checks offline e commits e escreve OpenSpec fora do escopo do implementador; não pedir acesso extra ou escrever metadados OpenSpec por conta própria, exceto o arquivo existente explicitamente autorizado. Planejamento, validação e revisão não executam código do checkout. Testes do host são sem rede externa, contas ou socket Docker. Não ler .env, credenciais ou dados reais. Não executar instalação, migração, produção, push, merge ou deploy dentro dos agentes.
Use português brasileiro e o schema obrigatório da etapa. Sentinel e revisor verificam cada critério no mesmo HEAD/plano com a evidência real dos checks, sem inventar execução ou copiar a conclusão do outro. Distinguir prova offline, CI remoto e aceitação real. Necessidade de sair do escopo gera BLOCKED/REPLAN_REQUIRED com motivo preciso. Entregar somente com todos os checks aplicáveis aprovados e limitações explícitas.


Critérios específicos:
- Conferir o commit de preparo do host 49efac0e00b935ed89cbacea6e266255d3f7f3da e seu pai 43cd73e423c25e20ebe0c25c0dd094a199c87648. O lockfile foi regenerado pelo pnpm declarado, sem scripts, e não deve ser reescrito manualmente pelo agente.
- Comparar manifest/importer do lockfile para as seis dependências OTEL já declaradas; preservar todas as versões/specifiers do package.json, artefato harness-v0.2.0 e pnpm-workspace. Dependências antigas preservam versões, admitindo novas associações de peers resultantes de OTEL.
- Acrescentar ao README um procedimento curto e exato de instalação congelada e regeneração deliberada do lockfile, indicando que falha de instalação não se resolve removendo --frozen-lockfile. Não reescrever o restante do README.
- O host deve comprovar instalação congelada do candidato no build da imagem e executar checks offline de lockfile, conformance do produto, typecheck, testes e build no HEAD final. Não afirmar deploy ou migração. Registrar qualquer falha preexistente com evidência em vez de mascará-la.
- Não alterar versões, manifests, workflows de deploy, código de aplicação, secrets, migrações ou APIs; necessidade de corrigir comportamento fora deste escopo exige replanejamento. A conclusão desta tarefa é entrega revisada e PR com CI; main dispara migração e deploy e não será integrado automaticamente.

O build foi executado e atestado pelo host com comando, saída, exit_code, digest da imagem e hashes dos manifests do candidato em /handoff/rules/BUILD-EVIDENCE.json. Compare esse digest com RUNNER-CONFIG.json. A evidência é adicional a tests.json. Ao documentar falha de instalação, não atribuir qualquer falha a lockfile desatualizado: diagnosticar a mensagem, que também pode indicar rede, integridade ou permissões. O CI do PR é externo, posterior à revisão local, e será acompanhado pelo coordenador.

CONTINUAÇÃO APÓS COTA: nova base 8aa17557562b7521674785bcc063528eb16d25ed; ela contém implementação e checks locais aprovados, mas ainda sem aprovação de Sentinel/revisor. Leia /handoff/rules/CANDIDATE-EVIDENCE.json. Não há retomada ou alteração da tarefa FAILED. Esta é uma nova tarefa, cujo aceite exige revisar todo o diff desde a base original 43cd73e423c25e20ebe0c25c0dd094a199c87648. Faça apenas correções demonstradamente necessárias e a atualização documental seguinte, para concluir o trabalho sem repetir implementação já presente.
Atualizar também as afirmações obsoletas do README que dizem que typecheck, Jest e build falham ou que erros de build são ignorados: os checks atuais passaram, next.config.js mantém os ignores em false. Registrar essa baseline local com limites, preservando as dependências externas e a ausência de aceitação de produção. Não afirmar deploy realizado.

A configuração do runner e as identidades locais imutáveis das imagens foram registradas pelo host em /handoff/rules/RUNNER-CONFIG.json e congeladas com as regras da tarefa. Esse arquivo é evidência da configuração; /handoff/tests.json comprova os resultados posteriores no HEAD final. CI remoto e sua versão Python pertencem à etapa externa de entrega, não são presumidos como executados. Os commits internos são produzidos pelo host e não podem ser reescritos pelo agente.

## Out of scope

- Alterar package.json, pnpm-workspace.yaml, versões, specifiers, artefato harness-v0.2.0, aplicação, APIs, migrações, workflows, Dockerfile ou secrets.
- Reescrever manualmente o lockfile, repetir implementação sem defeito demonstrado ou reescrever commits internos.
- Executar código do checkout, instalações, checks ou operações Docker pelos agentes.
- Ler arquivos .env, credenciais ou dados reais; ampliar permissões ou copiar código de outro produto.
- Escrever metadados OpenSpec pelo implementador; o host registra o plano fora desse escopo.
- Executar push, merge, migração ou deploy pelos agentes; publicação do PR e acompanhamento do CI pertencem ao coordenador após REVIEWED.

## Acceptance

- AC1: Conferir o preparo 49efac0e00b935ed89cbacea6e266255d3f7f3da e seu pai 43cd73e423c25e20ebe0c25c0dd094a199c87648; preservar a regeneração pelo pnpm declarado sem scripts, sem reescrita manual do lockfile.
- AC2: Manifest e importer correspondem para @opentelemetry/api, auto-instrumentations-node, exporter-trace-otlp-http, resources, sdk-node e semantic-conventions. Preservar todos os specifiers e versões do package.json, pnpm-workspace e harness-v0.2.0; dependências anteriores mantêm versões, admitindo novas associações de peers de OTEL.
- AC3: O README contém procedimento curto e exato com pnpm declarado, pnpm install --frozen-lockfile e regeneração deliberada com pnpm install --lockfile-only --ignore-scripts, revisão do diff e instalação congelada. Falhas exigem diagnóstico da mensagem, inclusive rede, integridade ou permissões, sem remover --frozen-lockfile.
- AC4: BUILD-EVIDENCE.json comprova instalação congelada na imagem compatível com o runner e hashes finais. tests.json comprova, no HEAD final, lockfile offline, conformance, typecheck, testes e build aprovados. Falhas preexistentes são registradas com evidência, sem mascaramento; prova offline, CI remoto e aceitação real permanecem distintos, sem afirmar migração ou deploy.
- AC5: A implementação respeita README.md e pnpm-lock.yaml como caminhos autorizados e todas as proibições do envelope, mantendo capacidades REUSE. Necessidade de sair do escopo gera BLOCKED/REPLAN_REQUIRED. PR e CI são G5 externo do coordenador após REVIEWED; main não será integrado automaticamente, pois dispara migração e deploy.
- AC6: A nova tarefa parte de 8aa17557562b7521674785bcc063528eb16d25ed e valida e revisa todo o diff de produto desde 43cd73e423c25e20ebe0c25c0dd094a199c87648, inclusive correções herdadas, com novos checks no HEAD final. A falha anterior por cota não constitui aprovação nem teste reprovado; correções existentes só são alteradas mediante defeito demonstrado.
- AC7: O README deixa de afirmar que typecheck, Jest e build falham ou ignoram erros; registra os checks locais aprovados e os dois ignores em false, preservando as dependências externas e os limites de validação funcional e produção, sem afirmar deploy realizado.
