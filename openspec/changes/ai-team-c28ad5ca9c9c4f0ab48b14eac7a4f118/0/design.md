# Isolated plan

Plan ID: f5493b7140a7448f528d99b5d46c25a8df630dd02859d2620644187ca2d9fc28
Planning HEAD: 49efac0e00b935ed89cbacea6e266255d3f7f3da
Risk: R2

## Assumptions

- O HEAD inspecionado é o commit de preparo informado, cujo pai é 43cd73e423c25e20ebe0c25c0dd094a199c87648; somente pnpm-lock.yaml mudou nesse preparo.
- Os hashes locais de package.json, pnpm-lock.yaml, pnpm-workspace.yaml e vendor/harness-artifact.json correspondem a BUILD-EVIDENCE.json.
- O image_id de BUILD-EVIDENCE.json coincide com test_image de RUNNER-CONFIG.json: sha256:03dc98b21ca4dae2f58a4bd6e7a2f368e4ce64aa8d65aad8c9e5af5ab8100cb8. A evidência registra exit_code 0 e reutilização da camada de pnpm install --frozen-lockfile.
- A alteração planejada é documental; o lockfile preparado será preservado byte a byte. Nenhuma lógica nova justifica teste adicional ou ampliação do escopo.
- Aplicam-se o perfil devops, o kit 37184551a1440b26fc5f117334f3ba3298332779 e o harness b3375495bd86b6ee01d8430419496cbc492fbb49.
- Os resultados posteriores em /handoff/tests.json serão produzidos pelo host; sua ausência nesta etapa de planejamento não comprova aprovação nem impede planejar os checks.
- O host registra o plano aceito em OpenSpec fora do escopo do implementador.

## Validation

- Inspeção estática do diff pai → preparo → HEAD final; somente pnpm-lock.yaml no preparo e acréscimo documental em README.md na implementação.
- Comparar manifest/importer para @opentelemetry/api, auto-instrumentations-node, exporter-trace-otlp-http, resources, sdk-node e semantic-conventions; conferir versões antigas independentemente dos sufixos de peers.
- Conferir checksum do tarball contra vendor/harness-artifact.json e preservar os quatro hashes registrados em BUILD-EVIDENCE.json no candidato final.
- Conferir a evidência de docker build do host, exit_code 0, camada congelada reutilizada e digest idêntico ao test_image; não confundir esse Dockerfile de evidência com o Dockerfile do produto.
- Somente o host: preparar node_modules da imagem e executar pnpm install --lockfile-only --offline --frozen-lockfile --ignore-scripts; verificar que o lockfile permaneceu inalterado.
- Somente o host: executar pnpm run validate:product-contract, pnpm run typecheck e pnpm test conforme RUNNER-CONFIG.json.
- Somente o host: executar o preparo do limitador de CPU e NEXT_TELEMETRY_DISABLED=1 NODE_OPTIONS=--require=/tmp/portfolio-cpu-limit.cjs pnpm run build, exatamente conforme o runner congelado.
- Exigir em tests.json identificação do HEAD final, comandos, saídas e exit_codes dos checks aplicáveis, sem rede externa, contas ou socket Docker.
- Bloquear a entrega local se houver check obrigatório reprovado; registrar eventual falha preexistente com evidência, sem supressão ou correção fora do escopo.
- Após revisão local aprovada, o coordenador publica o PR e acompanha CI no SHA revisado; não presumir execução remota, versão Python, aceitação funcional real, migração ou deploy.
