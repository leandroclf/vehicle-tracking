# Artefato do Product Platform Harness

O produto consome o pacote compilado do harness a partir de um **release** do repositório da plataforma
(`leandroclf/product-platform`, tag `harness-v<versão>`). O arquivo `.tgz` é o ativo publicado nesse release,
guardado aqui para que o deploy não dependa de acesso ao repositório privado. Não editar seu conteúdo nem
copiar suas primitives para o source do produto. Origem, tag, commit e checksum estão em `harness-artifact.json`.

`pnpm install --frozen-lockfile` instala o artefato. `validate:product-contract` confere o repositório de origem,
a tag, o nome do arquivo, a identidade da dependência e os bytes por SHA-256, que deve ser o publicado no
`SHA256SUMS` do release. O lockfile também registra a integridade do tarball.

Para atualizar:

1. escolher um release `harness-v*` da plataforma (a CI do release valida versão, commit em `main` e testes);
2. baixar o ativo e o `SHA256SUMS` do release (`gh release download harness-vX.Y.Z -R leandroclf/product-platform`);
3. conferir o SHA-256 do `.tgz` com o `SHA256SUMS`, colocar o arquivo em `vendor/` e remover o anterior;
4. atualizar `harness-artifact.json` (versão, tag, commit da tag, arquivo, sha256) e a dependência em `package.json`;
5. atualizar o lockfile e executar `pnpm run validate` no consumidor.

Não substituir os bytes mantendo a mesma identidade.

A partir da 0.2.0 o harness valida cada evento em tempo de execução (`createProductEvent` rejeita campos
desconhecidos e metadados inválidos); os wrappers do produto não precisaram mudar.

As integrações PostHog/HubSpot, a persistência de outbox, a autenticação e o tratamento de falhas de entrega
continuam nos adapters do produto. Eventos, decisão de limite e mapeamento de sinal comercial vêm do pacote
compartilhado.
