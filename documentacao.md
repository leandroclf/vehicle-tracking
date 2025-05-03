# Documentação do Aplicativo Yukz - Rastreamento Veicular (Versão Evoluída)

## 1. Visão Geral

O Yukz é um aplicativo de rastreamento veicular que permite aos usuários monitorar seus veículos em tempo real, visualizar histórico de rotas, receber alertas, gerenciar geocercas e gerar relatórios detalhados. Esta versão representa uma evolução significativa do protótipo inicial, incorporando um backend funcional com banco de dados persistente, autenticação segura e funcionalidades avançadas.

## 2. Funcionalidades Implementadas

Esta versão inclui todas as funcionalidades do protótipo inicial, agora suportadas por um backend real:

- **Autenticação Segura**: Sistema de login e registro com persistência em banco de dados e autenticação via JWT (JSON Web Tokens).
- **Backend Funcional**: API RESTful desenvolvida para gerenciar usuários, veículos, geocercas, configurações e alertas.
- **Banco de Dados Persistente**: Utilização de banco de dados SQL para armazenamento seguro e escalável dos dados.
- **Gerenciamento Completo de Veículos**: CRUD (Criar, Ler, Atualizar, Deletar) de veículos associados ao usuário.
- **Gerenciamento de Geocercas**: CRUD completo para geocercas circulares e poligonais, com alertas de entrada/saída configuráveis.
- **Gerenciamento de Alertas**: Listagem de alertas gerados (velocidade, ignição, geocerca, etc.) e marcação como lidos.
- **Configurações do Usuário**: Persistência das preferências do usuário (alertas, mapa, tema, etc.) no banco de dados.
- **Interface Responsiva**: Adaptações na interface para melhor visualização e uso em dispositivos móveis.
- **Integração Frontend-Backend**: O frontend agora consome a API real para todas as operações, utilizando o token JWT para autenticação.
- **Estrutura de Testes**: Configuração do ambiente de testes com Jest e React Testing Library (testes iniciais implementados).
- **Configuração de Infraestrutura**: Preparação do ambiente para deploy.

## 3. Tecnologias Utilizadas

- **Frontend**: Next.js 15.1.4 com React 19.1.0
- **Backend**: Node.js com Express
- **Banco de Dados**: PostgreSQL
- **Estilização**: Tailwind CSS
- **Gerenciamento de Estado (Frontend)**: Context API do React
- **Autenticação**: JWT (jsonwebtoken), bcryptjs
- **Validação (Backend)**: Zod
- **Testes**: Jest, React Testing Library (@testing-library/react, @testing-library/jest-dom)
- **Utilitários**: uuid

## 4. Credenciais de Demonstração

Para acessar o aplicativo (após deploy ou rodando localmente com o backend), utilize as credenciais:
- **Email**: demo@yukz.com
- **Senha**: demo123
*(Nota: Se rodando localmente pela primeira vez, pode ser necessário registrar este usuário através da interface ou via API)*

## 5. Estrutura do Projeto

```
yukz-app/
├── __tests__/                  # Testes automatizados
│   ├── api/                    # Testes de API
│   │   └── components/             # Testes de componentes React
│   ├── migrations/                 # Migrações do banco de dados
│   │   └── 0001_initial_schema.sql
│   ├── src/
│   │   ├── app/
│   │   │   ├── api/                # Rotas da API (Backend - Express)
│   │   │   │   ├── auth/ (login, register)
│   │   │   │   ├── vehicles/ ([id])
│   │   │   │   ├── geofences/ ([id])
│   │   │   │   ├── settings/
│   │   │   │   └── alerts/
│   │   │   ├── dashboard/        # Rotas protegidas (Frontend)
│   │   │   │   ├── dashboard/
│   │   │   │   ├── map/
│   │   │   │   ├── history/
│   │   │   │   ├── vehicles/
│   │   │   │   ├── geofences/      # Nova página de geocercas
│   │   │   │   ├── alerts/         # Nova página de alertas
│   │   │   │   ├── reports/
│   │   │   │   ├── profile/
│   │   │   │   └── settings/
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── layout.tsx          # Layout principal
│   │   ├── components/             # Componentes React reutilizáveis
│   │   │   ├── auth/
│   │   │   ├── dashboard/
│   │   │   ├── map/
│   │   │   ├── vehicle/
│   │   │   ├── ui/
│   │   │   └── layout/
│   │   ├── lib/                    # Bibliotecas, utilitários e contextos
│   │   │   ├── auth.tsx            # Contexto e hooks de autenticação (Frontend)
│   │   │   ├── apiClient.ts        # Cliente HTTP para consumir a API
│   │   │   ├── auth-middleware.ts  # Middleware de autenticação JWT (Backend)
│   │   │   ├── jwt.ts              # Funções para gerar/verificar JWT (Backend)
│   │   │   ├── vehicles.tsx        # Contexto/Hooks para veículos (Frontend)
│   │   │   ├── alerts.tsx          # Contexto/Hooks para alertas (Frontend)
│   │   │   ├── reports.tsx         # Contexto/Hooks para relatórios (Frontend)
│   │   │   ├── settings.tsx        # Contexto/Hooks para configurações (Frontend)
│   │   │   └── providers.tsx       # Agrupador de provedores de contexto
│   │   └── styles/                 # Estilos globais
│   ├── public/                     # Arquivos estáticos
│   ├── .env.example                # Exemplo de variáveis de ambiente
│   ├── .gitignore
│   ├── jest.config.js              # Configuração do Jest
│   ├── jest.setup.js               # Setup dos testes Jest
│   ├── next.config.mjs             # Configuração do Next.js
│   ├── package.json
│   └── tsconfig.json
```

## 6. Instruções de Instalação e Execução Local

### Pré-requisitos
- Node.js 18.0.0 ou superior
- npm (geralmente vem com Node.js)
- PostgreSQL instalado e configurado

### Passos

1.  **Clone o repositório** (se ainda não o fez):
    ```bash
    # git clone ...
    cd yukz-app/yukz-app
    ```
2.  **Instale as dependências** (pode ser necessário `--legacy-peer-deps` devido a conflitos temporários):
    ```bash
    npm install --legacy-peer-deps
    ```
3.  **Configure o Banco de Dados**:
    *   Crie um banco de dados PostgreSQL para o projeto.
    *   Aplique as migrações para criar as tabelas:
        ```bash
        npm run migrate
        ```
4.  **Configure Variáveis de Ambiente**:
    *   Crie um arquivo `.env` na raiz do projeto (`yukz-app/yukz-app`).
    *   Adicione as variáveis necessárias:
        ```
        DATABASE_URL=postgres://usuario:senha@localhost:5432/yukz_db
        JWT_SECRET=sua_chave_secreta_super_segura_aqui
        ```
5.  **Inicie o Servidor de Desenvolvimento**:
    ```bash
    npm run dev
    ```
    Isso iniciará o frontend Next.js e o backend Express localmente.
6.  **Acesse o aplicativo** em seu navegador:
    ```
    http://localhost:3000
    ```

## 7. Guia de Uso

O uso geral permanece similar ao protótipo, mas agora as ações interagem com o backend real:

- **Autenticação**: Login e registro agora criam/validam usuários no banco de dados. O token JWT é armazenado localmente para sessões futuras.
- **Gerenciamento**: Adicionar, editar ou excluir veículos e geocercas persistirá as alterações no banco de dados.
- **Configurações**: Alterações nas configurações de alertas ou preferências são salvas no perfil do usuário.
- **Alertas**: A página de alertas exibirá os alertas reais gerados (a lógica de *geração* de alertas baseada em eventos ainda precisa ser implementada).

## 8. Detalhes da API Backend

Os seguintes endpoints foram implementados:

- `POST /api/auth/register`: Cria um novo usuário.
- `POST /api/auth/login`: Autentica um usuário e retorna um token JWT.
- `GET /api/vehicles`: Lista os veículos do usuário autenticado.
- `POST /api/vehicles`: Adiciona um novo veículo.
- `GET /api/vehicles/{id}`: Obtém detalhes de um veículo específico.
- `PUT /api/vehicles/{id}`: Atualiza um veículo específico.
- `DELETE /api/vehicles/{id}`: Remove um veículo específico.
- `GET /api/geofences`: Lista as geocercas do usuário autenticado.
- `POST /api/geofences`: Adiciona uma nova geocerca.
- `GET /api/geofences/{id}`: Obtém detalhes de uma geocerca específica.
- `PUT /api/geofences/{id}`: Atualiza uma geocerca específica.
- `DELETE /api/geofences/{id}`: Remove uma geocerca específica.
- `GET /api/settings`: Obtém as configurações do usuário autenticado.
- `PUT /api/settings`: Atualiza as configurações do usuário.
- `GET /api/alerts`: Lista os alertas do usuário autenticado.
- `PUT /api/alerts/{id}/read`: Marca um alerta específico como lido.
- `PUT /api/alerts/read-all`: Marca todos os alertas como lidos.

*Todos os endpoints (exceto login/registro) requerem um token JWT válido no cabeçalho `Authorization: Bearer <token>`.*

## 9. Testes Automatizados

- O ambiente de testes foi configurado com Jest e React Testing Library.
- Scripts de teste podem ser executados com `npm run test`.
- Foram criados arquivos de teste iniciais para alguns componentes (`Header`) e endpoints da API (veículos, geocercas, configurações, alertas) em `__tests__/`.
- **Observação**: Os testes estão atualmente falhando devido a problemas de configuração de mapeamento de módulos no Jest que precisam ser investigados e corrigidos.

## 10. Infraestrutura e Deploy

- O projeto está configurado para desenvolvimento local e produção.
- Inclui a definição do banco de dados (local e produção) e variáveis de ambiente (como `JWT_SECRET` para produção).
- O build para produção pode ser gerado com `npm run build`.
- O deploy pode ser feito em qualquer plataforma que suporte Node.js, como Vercel, Heroku, ou AWS.

## 11. Limitações Atuais

- **Integração com Hardware**: Ainda não há integração com dispositivos de rastreamento reais. Os dados de localização/telemetria precisam ser inseridos via API ou simulação.
- **Geração de Alertas**: A *lógica* para gerar alertas automaticamente (ex: quando um veículo excede a velocidade ou entra/sai de uma geocerca) não foi implementada no backend.
- **Mapa**: A integração com um serviço de mapa real (Google Maps, Mapbox, Leaflet) ainda é necessária no frontend.
- **Funcionalidades Avançadas**: Relatórios complexos, histórico detalhado de rotas no mapa e comandos remotos ainda dependem de maior desenvolvimento no backend e frontend.
- **Testes**: Os testes automatizados precisam ser corrigidos e expandidos.

## 12. Próximos Passos Sugeridos

1.  **Corrigir Testes Automatizados**: Investigar e resolver os problemas de configuração do Jest.
2.  **Implementar Lógica de Geração de Alertas**: Criar processos no backend para monitorar eventos e gerar alertas no banco de dados.
3.  **Integrar Mapa Real**: Substituir o mapa simulado no frontend por uma biblioteca como Leaflet, Mapbox GL JS ou Google Maps Platform.
4.  **Desenvolver API de Ingestão de Dados**: Criar um endpoint seguro para receber dados dos dispositivos de rastreamento.
5.  **Refinar Frontend**: Melhorar a interface com base no mapa real, exibir histórico no mapa, implementar funcionalidade completa de relatórios e comandos remotos.
6.  **Aplicativo Móvel**: Considerar o desenvolvimento de aplicativos nativos ou PWA.
7.  **Infraestrutura de Produção**: Configurar completamente o ambiente de produção (banco de dados, secrets, etc.) e implementar CI/CD.

## 13. Suporte

Para suporte ou dúvidas, entre em contato através do email suporte@yukz.com.

---

© 2025 Yukz - Todos os direitos reservados

