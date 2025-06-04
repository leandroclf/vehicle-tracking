# Yukz - Aplicação de Rastreamento Veicular

Este repositório contém o código-fonte da aplicação Yukz, uma plataforma de rastreamento veicular desenvolvida com Next.js, Supabase, Google Maps e um servidor dedicado para comunicação com dispositivos rastreadores.

## Acesso para Teste

Para acessar o sistema com usuários de teste, consulte a documentação em [docs/acesso-teste.md](docs/acesso-teste.md).

## Estrutura do Projeto

O projeto está organizado em duas partes principais:

*   `/yukz-app`: Contém a aplicação principal desenvolvida em Next.js. Isso inclui:
    *   Frontend (interface do usuário) em React.
    *   API backend (rotas em `/src/app/api`) que interage com o Supabase.
    *   Integração com Google Maps para visualização.
    *   Configuração para deploy no Cloudflare Workers (embora migrado para Supabase, alguns arquivos podem permanecer).
    *   `Dockerfile` para containerização da aplicação Next.js.
*   `/tracker-server`: Contém o servidor Node.js dedicado para receber e processar dados de dispositivos rastreadores GPS via TCP/UDP.
    *   Implementação inicial para o protocolo Teltonika Codec8.
    *   Integração com Supabase para atualizar o status dos veículos.

## Pré-requisitos

*   Node.js (versão 18 ou superior recomendada)
*   `npm` (ou `pnpm` para a aplicação `yukz-app`)
*   Conta no Supabase (para o banco de dados e autenticação)
*   Chave de API do Google Maps (com a API Maps JavaScript habilitada)
*   Git

## Configuração

1.  **Clonar o repositório:**
    ```bash
    git clone <url-do-repositorio>
    cd yukz
    ```

2.  **Configurar a Aplicação Principal (`yukz-app`):**
    *   Navegue até o diretório: `cd yukz-app`
    *   Instale as dependências: `npm install` (ou `pnpm install`)
    *   Crie um arquivo `.env` na raiz de `yukz-app` com base no exemplo abaixo, preenchendo com suas credenciais:
        ```env
        # Credenciais do Supabase (para o cliente)
        SUPABASE_URL=https://<seu-projeto-id>.supabase.co
        SUPABASE_ANON_KEY=<sua-chave-anon>

        # Chave da API do Google Maps
        GOOGLE_MAPS_API_KEY=<sua-chave-google-maps>

        # Outras configurações (opcional)
        APP_NAME=Yukz Tracking
        APP_VERSION=1.0.0
        ```

3.  **Configurar o Servidor de Rastreadores (`tracker-server`):**
    *   Navegue até o diretório: `cd ../tracker-server`
    *   Instale as dependências: `npm install`
    *   Crie um arquivo `.env` na raiz de `tracker-server` com base no exemplo abaixo, preenchendo com suas credenciais:
        ```env
        # Credenciais do Supabase (para o servidor)
        SUPABASE_URL=https://<seu-projeto-id>.supabase.co
        SUPABASE_ANON_KEY=<sua-chave-anon> # Pode ser a mesma do cliente
        SUPABASE_SERVICE_ROLE_KEY=<sua-chave-service-role> # ESSENCIAL para operações de backend

        # Configurações do servidor de rastreadores
        TRACKER_TCP_PORT=5027  # Porta para Teltonika (ou outra desejada)
        TRACKER_UDP_PORT=5028  # Porta para UDP (se necessário)

        # Configurações de log
        LOG_LEVEL=info
        ```

4.  **Configurar o Banco de Dados Supabase:**
    *   Acesse seu projeto Supabase.
    *   Vá para o "SQL Editor".
    *   Execute o script de migração localizado em `/yukz-app/supabase/migrations/20250427221812_initial_schema.sql` para criar as tabelas e políticas RLS necessárias.

## Sistema de Migração de Banco de Dados

### Estrutura Unificada

O projeto utiliza um sistema de migração de banco de dados unificado para simplificar a manutenção e garantir consistência. O esquema completo está definido em um único arquivo:

- `migrations/unified_schema.sql`: Contém todas as definições de tabelas, funções, gatilhos e políticas de segurança.

### Principais Tabelas

O banco de dados inclui as seguintes tabelas principais:

1. **profiles**: Perfis de usuários vinculados ao Supabase Auth
2. **vehicles**: Veículos cadastrados por usuário
3. **vehicle_status**: Estado atual dos veículos
4. **events**: Eventos históricos dos veículos
5. **alerts**: Alertas gerados para os usuários
6. **notifications**: Notificações do sistema
7. **settings**: Configurações por usuário
8. **geofences**: Cercas virtuais definidas pelos usuários
9. **reports**: Relatórios gerados no sistema

### Aplicando Migrações

As migrações são aplicadas automaticamente durante a inicialização da API. Para aplicar manualmente, utilize:

```bash
npm run migrate
```

### Modificando o Esquema

Para modificar o esquema do banco de dados:

1. Edite o arquivo `migrations/unified_schema.sql`
2. Reinicie a aplicação ou execute `npm run migrate`

Isso garante que todas as alterações sejam aplicadas de forma consistente em todos os ambientes.

## Executando a Aplicação

1.  **Iniciar a Aplicação Principal (Next.js):**
    *   Navegue até `cd ../yukz-app`
    *   Execute o servidor de desenvolvimento: `npm run dev` (ou `pnpm dev`)
    *   Acesse a aplicação no seu navegador, geralmente em `http://localhost:3000`.

2.  **Iniciar o Servidor de Rastreadores:**
    *   Navegue até `cd ../tracker-server`
    *   Execute o servidor: `node server.js`
    *   O servidor começará a ouvir conexões TCP na porta especificada no `.env` (padrão 5027).

## Testes

### Testes de API

O projeto inclui uma suíte de testes para verificar se todos os endpoints da API estão adequadamente protegidos e validam os tokens corretamente.

Para executar os testes de API:

```bash
# Executar todos os testes de API
npm run test:api

# Testar apenas a proteção dos endpoints
npm run test:api:protection

# Testar apenas a validação de tokens JWT
npm run test:api:auth
```

Estes testes verificam:

1. Se todos os endpoints protegidos exigem um token válido
2. Se os endpoints rejeitam tokens inválidos ou expirados
3. Se os endpoints aceitam tokens válidos
4. Se a validação de dados de entrada está funcionando corretamente

Para adicionar novos endpoints à suíte de testes, edite o arquivo `__tests__/api/api-endpoints-protection.test.ts`.

## Docker

A aplicação principal (`yukz-app`) possui um `Dockerfile` que pode ser usado para criar uma imagem Docker. O servidor de rastreadores (`tracker-server`) também conta com um `Dockerfile`, localizado em `tracker-server/Dockerfile`.

Para construir a imagem da aplicação principal:

```bash
cd yukz-app
docker build -t yukz-app .
```

## Próximos Passos e Melhorias

*   Implementar decodificadores para outros protocolos de rastreadores (Queclink, Concox, etc.) no `tracker-server`.
*   Adicionar servidor UDP no `tracker-server`.
*   Implementar a lógica de geração de alertas (velocidade, geocerca) no `tracker-server` ou via funções Supabase.
*   Implementar a visualização de geocercas no mapa Google Maps.
*   Substituir os dados simulados de veículos no frontend por dados reais do Supabase.
*   Adicionar testes automatizados.
*   Revisar e otimizar o `Dockerfile` existente do `tracker-server` (`tracker-server/Dockerfile`).
*   Configurar `docker-compose` para orquestrar os serviços.

---
