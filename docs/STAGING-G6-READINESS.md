# G6 — Prontidão de Preview/Staging para vehicle-tracking

## O que esta mudança entrega

- Declara um **Worker separado** `yukz-app-staging`, sem configurar acesso a banco de produção, rotas/domínios públicos nem secrets.
- Adiciona `scripts/validate-staging-config.cjs` com checagens estáticas de separação em `wrangler.toml`, sem acessar Cloudflare ou modificar infraestrutura.
- Inclui casos negativos via `node --test tests/staging-config.test.cjs`, executados no `pnpm validate` do CI atual.
- Preserva o workflow de produção manual existente, **sem alterar regras de ambiente ou secrets**.

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
