# G6 — Prontidão de Preview/Staging para vehicle-tracking

## O que esta mudança entrega

- Declara um **Worker separado** `yukz-app-staging`, sem configurar acesso a banco de produção, rotas/domínios públicos nem secrets.
- Adiciona `scripts/validate-staging-config.cjs` com checagens estáticas de separação em `wrangler.toml`, sem acessar Cloudflare ou modificar infraestrutura.
- Inclui casos negativos via `node --test tests/staging-config.test.cjs`, executados no `pnpm validate` do CI atual.
- Preserva o workflow de produção manual existente, **sem alterar regras de ambiente ou secrets**.

## Ensaio de build offline do Staging

O workflow manual `.github/workflows/staging-bundle-dry-run.yml` executa apenas em `main`, sem environment privilegiado, secrets, token Cloudflare ou migração. Ele executa `pnpm validate`, os testes offline do verificador, `pnpm build:worker` e então o comando oficial `pnpm exec wrangler deploy --env staging --dry-run --outdir .g6-staging-dry-run`. A opção `--dry-run` compila o Worker e não publica na Cloudflare. Os bundles JavaScript gerados são vinculados ao SHA do commit e recebem fingerprint local SHA-256 através de `scripts/verify-staging-dry-run.py`. A saída reporta `deployment_executed=false` e `authorized_to_deploy=false`.

O ensaio também produz um manifesto JSON sanitizado em `Actions → execução → Artifacts`, nomeado `staging-dry-run-evidence-<SHA>` e retido por 14 dias. Contém SHA Git e SHA-256/nome relativo dos bundles e flags negativas para deployment e autorização. A escrita falha se o destino já existir ou for symlink. Este arquivo é **evidência do build local**, não um atestado de publicação, aprovação ou saúde de Cloudflare. Evite adicionar logs e outputs brutos ao artefato.

**Esse workflow não faz deploy, não configura Staging na Cloudflare e não verifica banco, Redis, endpoints ou aprovação de produção.** O artefato local não é prova de publicação no registry. Essa preparação não habilita workflow de produção.

Para executar: GitHub → Actions → `staging-bundle-dry-run` → Run workflow → branch `main`. Se falhar, corrigir build/compatibilidade em PR separado, sem contornar checks.

## Preparação obrigatória antes de qualquer deploy em staging

1. Configurar um environment GitHub `staging` com separação de credenciais e revisão de branch/atores; não apontar para produção.
2. Confirmar conta Cloudflare de destino e configurar secrets **isolados** para `--env staging`, nunca reutilizando tokens ou bindings de `production` quando houver alternativas de escopo mínimo.
3. Provisionar banco PostgreSQL e Redis **não produtivos**, dados sintéticos, e demais integrações de sandbox. Migrações do banco staging exigem plano próprio; não executar automaticamente as migrações de produção.
4. Confirmar que `wrangler deploy --env staging` usa exclusivamente recursos de staging. Exigir URL HTTPS do endpoint de saúde e verificar respostas pós-deploy.
5. Criar um pipeline **separado** para staging somente após revisão de segurança. Empacotar artefato com hash, integrar o contrato G6 versionado do Kit, conferir o CI e aplicar rollback testado com uma versão anterior conhecida.

## Evidências e limites

O validador entregue nesta fase analisa apenas um subconjunto deliberadamente restrito do `wrangler.toml`. Ele **não é parser TOML completo**, não executa Wrangler, não comprova permissões da conta Cloudflare e não atesta isolamento real de banco, Redis, secrets ou Workers externos. `pnpm validate:staging` passar significa **somente** que esta declaração estática satisfaz o padrão mínimo, não que um ambiente staging foi criado ou homologado.

A política completa do G6 reside no `product-platform` (`packages/kit/docs/DEPLOYMENT-G6.md`). O Kit e seus validadores precisam ser consumidos por commit/release imutável; não usar uma cópia flutuante do branch principal em um pipeline com credenciais.

**Proibido nesta fase:** deploy automático, migração produtiva, alteração de configurações da conta Cloudflare, produção sem aprovação ou simular sucesso de rollback não ensaiado.
