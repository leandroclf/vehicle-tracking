# Implantação de produção — proteção de primeira fase

Este produto já possui `.github/workflows/deploy.yml` com validação, migração de banco e deploy Cloudflare Workers. **A migração modifica dados de produção**: não deve ocorrer apenas porque uma alteração foi integrada à `main`.

## Comportamento proposto pelo PR de segurança

- O workflow de produção passa a executar **somente por `workflow_dispatch`**, iniciado deliberadamente na `main`.
- A proteção real requer configurar o environment `production` no GitHub com **required reviewers**, branch permitida `main` e secrets de escopo mínimo. A existência de `environment: production` no YAML, isoladamente, **não comprova que revisores estejam configurados**.
- Antes de qualquer migração, é obrigatório haver `PRODUCTION_HEALTH_URL` configurado e iniciado por `https://`; sem ele, a migração e publicação são bloqueadas. A URL deve ser um endpoint de saúde confiável pertencente ao produto.
- Depois da publicação, o smoke é **obrigatório**. Falha sinaliza falha do workflow, mas **não reverte automaticamente** o deploy.
- A sequência atual migra antes de publicar. Toda mudança de schema deve ser classificada como **EXPAND compatível**, com verificação separada de backup e reversibilidade; CONTRACT destrutivo somente após release posterior e análise humana.

## Passos pendentes antes de operar a produção

1. Revisão independente das mudanças em `deploy.yml` e dos rulesets; não contornar proteção de workflows.
2. Configuração e comprovação dos revisores obrigatórios, URL de saúde e branch restriction no environment de produção.
3. Integração real ao G6 do Product Kit, fixando versão imutável do script, ligando o build gerado ao SHA do checkout e verificando evidência de CI.
4. Ambiente Preview/Staging separado, sem credenciais nem banco de produção, smoke/integração e verificação da reversão.
5. Definição de rollback Cloudflare com versão anterior efetivamente disponível e teste supervisionado, alertas e FinOps.

**Estado:** somente controle inicial de gatilho e smoke obrigatório. Sem infraestrutura nova, deploy executado, rollback automático ou aprovação de produção validada por esta mudança.
