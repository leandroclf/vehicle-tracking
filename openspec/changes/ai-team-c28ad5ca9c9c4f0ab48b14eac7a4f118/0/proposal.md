# Objective

Consolidar a correção determinística do lockfile preparado pelo host, documentar sua reprodução e exigir evidências de instalação congelada e validação offline no HEAD final, sem deploy.

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

A configuração do runner e as identidades locais imutáveis das imagens foram registradas pelo host em /handoff/rules/RUNNER-CONFIG.json e congeladas com as regras da tarefa. Esse arquivo é evidência da configuração; /handoff/tests.json comprova os resultados posteriores no HEAD final. CI remoto e sua versão Python pertencem à etapa externa de entrega, não são presumidos como executados. Os commits internos são produzidos pelo host e não podem ser reescritos pelo agente.

## Out of scope

- Alterar package.json, pnpm-workspace.yaml, versões, specifiers ou o artefato harness-v0.2.0.
- Alterar aplicação, APIs, migrações, workflows, Dockerfile, secrets ou dependências.
- Executar código do checkout, instalações, checks, commits ou operações Docker dentro dos agentes.
- Reescrever manualmente o lockfile, reescrever commits internos ou escrever metadados OpenSpec pelo agente.
- Acessar credenciais, arquivos .env, dados reais, outros produtos ou ampliar permissões.
- Executar push, merge, migração ou deploy; publicar PR e acompanhar CI compete ao coordenador na etapa externa G5.

## Acceptance

- AC1: Conferir o preparo 49efac0e00b935ed89cbacea6e266255d3f7f3da e seu pai 43cd73e423c25e20ebe0c25c0dd094a199c87648, respeitando a regeneração pelo pnpm declarado sem scripts e sem reescrita manual do lockfile.
- AC2: As seis dependências OTEL declaradas devem corresponder ao importer; preservar todos os specifiers e versões do package.json, pnpm-workspace e harness-v0.2.0. Dependências antigas preservam versões, admitindo novas associações de peers decorrentes de OTEL.
- AC3: O README recebe procedimento curto e exato de instalação congelada e regeneração deliberada, sem reescrever o restante. Falhas exigem diagnóstico da mensagem e não justificam remover --frozen-lockfile.
- AC4: A evidência do host deve comprovar instalação congelada na imagem correspondente ao runner e aos hashes do candidato. No HEAD final, lockfile, conformance, typecheck, testes e build devem ter evidências reais. Registrar falhas preexistentes sem mascaramento e distinguir prova offline, CI remoto e aceitação real, sem afirmar migração ou deploy.
- AC5: Restringir a implementação aos caminhos autorizados, preservando manifests, versões, workflows, aplicação, secrets, migrações e APIs. Necessidade fora do escopo exige BLOCKED/REPLAN_REQUIRED. Revisão local depende dos checks do host; PR e CI são G5 externo posterior a REVIEWED, pelo coordenador. Não integrar automaticamente em main, que dispara migração e deploy.
