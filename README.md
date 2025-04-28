# Yukz - Aplicação de Rastreamento Veicular

Este repositório contém o código-fonte da aplicação Yukz, uma plataforma de rastreamento veicular desenvolvida com Next.js, Supabase, Google Maps e um servidor dedicado para comunicação com dispositivos rastreadores.

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
        VITE_SUPABASE_URL=https://<seu-projeto-id>.supabase.co
        VITE_SUPABASE_ANON_KEY=<sua-chave-anon>

        # Chave da API do Google Maps
        VITE_GOOGLE_MAPS_API_KEY=<sua-chave-google-maps>

        # Outras configurações (opcional)
        VITE_APP_NAME=Yukz Tracking
        VITE_APP_VERSION=1.0.0
        ```

3.  **Configurar o Servidor de Rastreadores (`tracker-server`):**
    *   Navegue até o diretório: `cd ../tracker-server`
    *   Instale as dependências: `npm install`
    *   Crie um arquivo `.env` na raiz de `tracker-server` com base no exemplo abaixo, preenchendo com suas credenciais:
        ```env
        # Credenciais do Supabase (para o servidor)
        VITE_SUPABASE_URL=https://<seu-projeto-id>.supabase.co
        VITE_SUPABASE_ANON_KEY=<sua-chave-anon> # Pode ser a mesma do cliente
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

## Executando a Aplicação

1.  **Iniciar a Aplicação Principal (Next.js):**
    *   Navegue até `cd ../yukz-app`
    *   Execute o servidor de desenvolvimento: `npm run dev` (ou `pnpm dev`)
    *   Acesse a aplicação no seu navegador, geralmente em `http://localhost:3000`.

2.  **Iniciar o Servidor de Rastreadores:**
    *   Navegue até `cd ../tracker-server`
    *   Execute o servidor: `node server.js`
    *   O servidor começará a ouvir conexões TCP na porta especificada no `.env` (padrão 5027).

## Docker

A aplicação principal (`yukz-app`) possui um `Dockerfile` que pode ser usado para criar uma imagem Docker. O servidor de rastreadores (`tracker-server`) ainda não possui um Dockerfile dedicado, mas pode ser adicionado.

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
*   Criar um `Dockerfile` para o `tracker-server`.
*   Configurar `docker-compose` para orquestrar os serviços.

---
