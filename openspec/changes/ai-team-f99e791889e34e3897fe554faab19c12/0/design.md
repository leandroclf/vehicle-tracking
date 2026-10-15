# Isolated plan

Plan ID: d7968ba6559ac4d912eddd454140b9bdbc33a64ee8b07bb05c030c6d2d443cf6
Planning HEAD: 8aa17557562b7521674785bcc063528eb16d25ed
Risk: R2

## Assumptions

- O HEAD inspecionado corresponde à nova base informada. Esta tarefa não retoma nem altera a tarefa FAILED anterior.
- O preparo 49efac0e00b935ed89cbacea6e266255d3f7f3da tem como pai 43cd73e423c25e20ebe0c25c0dd094a199c87648 e altera somente pnpm-lock.yaml; sua mensagem registra regeneração pelo pnpm declarado sem scripts.
- Os quatro hashes locais registrados em BUILD-EVIDENCE.json coincidem com o candidato. O checksum do tarball confere com vendor/harness-artifact.json.
- O image_id de BUILD-EVIDENCE.json coincide com test_image de RUNNER-CONFIG.json: sha256:03dc98b21ca4dae2f58a4bd6e7a2f368e4ce64aa8d65aad8c9e5af5ab8100cb8. O build atestado terminou com exit_code 0 e reutilizou a camada imutável de instalação congelada.
- CANDIDATE-EVIDENCE.json registra checks locais aprovados na base atual, mas nenhuma aprovação de Sentinel ou revisor. Essa evidência não substitui novos checks no HEAD final.
- O README já contém o procedimento de instalação e regeneração; a mudança necessária é documental e pontual. next.config.js mantém ignoreBuildErrors e ignoreDuringBuilds em false.
- Aplicam-se o perfil devops, o kit 37184551a1440b26fc5f117334f3ba3298332779 e o harness b3375495bd86b6ee01d8430419496cbc492fbb49.
- A ausência de tests.json nesta etapa não impede planejar; sua evidência no HEAD final será obrigatória para aprovação local.

## Validation

- Inspeção estática do diff integral desde 43cd73e423c25e20ebe0c25c0dd094a199c87648 até o HEAD final, distinguindo arquivos de produto dos metadados OpenSpec escritos pelo host.
- Comparar versões, specifiers, resoluções e integridades anteriores com o lockfile preparado, separando sufixos de peers das versões dos pacotes. Conferir as seis entradas OTEL e preservar manifests e artefato.
- Conferir os quatro hashes de BUILD-EVIDENCE.json, checksum do tarball, exit_code do build, camada congelada reutilizada e digest idêntico ao test_image. O Dockerfile dessa evidência não é o Dockerfile do produto.
- Somente o host: executar cp -R /deps/node_modules /work/node_modules e pnpm install --lockfile-only --offline --frozen-lockfile --ignore-scripts, conforme RUNNER-CONFIG.json; confirmar que o lockfile não mudou.
- Somente o host: executar pnpm run validate:product-contract, pnpm run typecheck e pnpm test.
- Somente o host: preparar exatamente o limitador de CPU registrado no runner e executar NEXT_TELEMETRY_DISABLED=1 NODE_OPTIONS=--require=/tmp/portfolio-cpu-limit.cjs pnpm run build.
- Exigir tests.json com HEAD final, comandos, saídas e exit_codes; checks sem rede externa, contas ou socket Docker, conforme os limites congelados do runner.
- Revisar pontualmente o README contra as evidências, sem presumir aprovação de lint dedicado, integração externa, CI remoto, versão Python remota ou produção.
- Nenhuma lógica nova é planejada; não acrescentar testes documentais que espelhem a implementação. Necessidade de lógica fora do escopo exige replanejamento.
- Bloquear aprovação local diante de check obrigatório reprovado ou evidência insuficiente. Sentinel e revisor avaliam independentemente todos os critérios no mesmo HEAD/plano.
- Após REVIEWED, o coordenador publica o PR e acompanha o CI externo no SHA revisado; merge, migração e deploy permanecem ações separadas.
