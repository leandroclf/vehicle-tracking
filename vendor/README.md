# Artefato do Product Platform Harness

O piloto consome um pacote compilado do proprietário canônico, proveniente do
commit remoto `ffb68c07dfbe491b804e3b59ad1e0ad791872e9e`. O arquivo `.tgz` é uma
dependência distribuída; não editar seu conteúdo nem copiar suas primitives
para o source do produto. Origem e checksum estão em `harness-artifact.json`.

O artefato foi construído em um clone independente desse SHA, com os dois testes
originais aprovados. Instaladores que desativam `prepare` podem produzir um
pacote Git sem `dist`; a distribuição local evita esse problema e permite
instalação do harness sem acesso ao repositório privado durante o deploy.
Demais dependências continuam sujeitas ao lockfile e ao registry.

`pnpm install --frozen-lockfile` instala o artefato. `validate:product-contract`
confere a identidade da dependência e os bytes por SHA-256. O lockfile também
registra a integridade do tarball.

Para atualizar: validar o proprietário, selecionar uma revisão publicada,
construir/obter um novo artefato, registrar seu SHA e checksum, atualizar o
lockfile e executar os testes do consumidor. Não substituir os bytes mantendo
a mesma identidade. O piloto ainda usa a API anterior à validação runtime de
eventos acrescentada neste ciclo; essa melhoria requer adoção posterior.

As integrações PostHog/HubSpot, a persistência de outbox, a autenticação e o
tratamento de falhas de entrega continuam nos adapters do produto. Eventos,
decisão de limite e mapeamento de sinal comercial vêm do pacote compartilhado.
