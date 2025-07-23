# Guia de Autenticação Social

## Visão Geral

O sistema de autenticação social permite que os usuários façam login e se registrem usando suas contas do Google, Facebook e Apple. Isso proporciona uma experiência de login mais rápida e conveniente, além de aumentar a segurança ao delegar a autenticação para provedores confiáveis.

## Arquitetura

O sistema de autenticação social foi implementado seguindo os princípios de Clean Architecture e DDD (Domain-Driven Design), com separação clara de responsabilidades:

### Camadas

1. **Camada de Apresentação**
   - Componentes React para botões de login social
   - Páginas de login, registro e perfil com suporte a autenticação social

2. **Camada de Aplicação**
   - Contexto de autenticação (AuthContext) com métodos para login/registro social
   - Serviço de autenticação social para orquestrar operações

3. **Camada de Domínio**
   - Tipos e interfaces para autenticação social
   - Regras de negócio para vinculação e desvinculação de contas

4. **Camada de Infraestrutura**
   - Integração com Supabase para armazenamento e autenticação
   - Tabelas e funções SQL para gerenciar contas sociais

### Banco de Dados

O sistema utiliza as seguintes tabelas no PostgreSQL:

- `social_accounts`: Armazena as contas sociais vinculadas aos usuários
- `social_providers_config`: Configurações para cada provedor social
- `social_auth_logs`: Registros de atividades de autenticação social

## Fluxos de Autenticação

### Login Social

1. Usuário clica no botão de login social (Google, Facebook ou Apple)
2. O SDK do provedor é inicializado e solicita autorização do usuário
3. Após autorização, o provedor retorna tokens de acesso/ID
4. O sistema verifica se o email já existe na base de dados:
   - Se existir, vincula a conta social ao usuário existente
   - Se não existir, cria um novo usuário com os dados do provedor
5. O usuário é autenticado e redirecionado para o dashboard

### Registro Social

1. Usuário clica no botão de registro social na página de registro
2. O SDK do provedor é inicializado e solicita autorização do usuário
3. Após autorização, o provedor retorna tokens e dados do usuário
4. O sistema cria um novo usuário com os dados fornecidos pelo provedor
5. O usuário é autenticado e redirecionado para o dashboard

### Vinculação de Contas

1. Usuário acessa a página de perfil
2. Clica no botão para vincular uma nova conta social
3. Após autorização no provedor, a conta social é vinculada ao usuário
4. O usuário pode usar qualquer uma das contas vinculadas para login

## Implementação

### Componentes

- `SocialLoginButtons`: Componente reutilizável para exibir botões de login social
- `ProfileForm`: Componente para gerenciar contas sociais vinculadas

### Serviços

- `social-auth-service.ts`: Implementa a lógica de autenticação social

### Tipos

- `social-auth.d.ts`: Define interfaces e tipos para autenticação social

### Migração SQL

- `20240102_add_social_auth.sql`: Cria as tabelas e funções necessárias

## Segurança

O sistema implementa as seguintes medidas de segurança:

1. **Tokens Seguros**: Tokens de acesso/ID são validados no backend
2. **Row Level Security (RLS)**: Políticas de acesso no banco de dados
3. **Logs de Auditoria**: Todas as ações de autenticação são registradas
4. **Limpeza Automática**: Tokens expirados são removidos periodicamente
5. **Validação de Email**: Verificação de duplicidade de emails

## Configuração

Para configurar os provedores sociais, é necessário:

1. Criar projetos/aplicativos nos consoles de desenvolvedor de cada provedor
2. Obter as credenciais (client_id, client_secret)
3. Configurar as URLs de redirecionamento
4. Inserir as configurações na tabela `social_providers_config`

## Testes

O sistema inclui testes para:

1. Fluxos de login social
2. Fluxos de registro social
3. Vinculação e desvinculação de contas
4. Tratamento de erros e casos de borda

## Limitações e Trabalhos Futuros

1. **Implementação de SDKs**: Atualmente, o sistema simula tokens para demonstração. É necessário implementar a integração com os SDKs reais dos provedores.
2. **Configuração por Ambiente**: Adicionar suporte para configurações diferentes por ambiente (dev, staging, prod).
3. **Suporte a Mais Provedores**: Expandir para outros provedores como Twitter, GitHub, etc.
4. **Melhorias de UX**: Adicionar feedback visual durante o processo de autenticação.
5. **Recuperação de Conta**: Implementar fluxo para recuperar acesso via contas sociais.

## Referências

- [Documentação do OAuth 2.0](https://oauth.net/2/)
- [Google Identity Services](https://developers.google.com/identity)
- [Facebook Login](https://developers.facebook.com/docs/facebook-login/)
- [Sign in with Apple](https://developer.apple.com/sign-in-with-apple/)
- [Supabase Auth](https://supabase.com/docs/guides/auth)