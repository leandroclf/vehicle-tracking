# Configuração do Supabase

Este documento descreve o processo de configuração do Supabase para o projeto Yukz de rastreamento veicular.

## Pré-requisitos

1. Conta no Supabase (gratuito para desenvolvimento em [supabase.com](https://supabase.com))
2. Projeto criado no Supabase
3. Variáveis de ambiente configuradas

## Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

```
# Configurações do Supabase
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-chave-anon-key
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role-key

# Configurações de autenticação
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=seu-segredo-aqui

# Configurações da aplicação
NEXT_PUBLIC_MAPS_API_KEY=sua-chave-google-maps
NODE_ENV=development
```

## Inicialização do Banco de Dados

O sistema foi projetado para inicializar o banco de dados automaticamente na primeira execução, aplicando as migrações necessárias. O processo segue as seguintes etapas:

1. Verificação se as tabelas já existem
2. Aplicação do script de migração (em `/migrations/20250427221812_initial_schema.sql`)
3. Criação de dados de teste em ambiente de desenvolvimento

## Estrutura do Banco de Dados

O esquema do banco de dados inclui as seguintes tabelas principais:

- **profiles**: Informações de perfil dos usuários
- **vehicles**: Cadastro de veículos com suas informações
- **vehicle_status**: Status atual de cada veículo (posição, velocidade, etc.)
- **trips**: Viagens registradas pelos veículos
- **events**: Eventos registrados durante a operação (ignição, paradas, etc.)
- **alerts**: Alertas gerados pelo sistema
- **settings**: Configurações por usuário
- **geofences**: Geocercas definidas pelos usuários

## Arquivos de Configuração

A configuração do Supabase é gerenciada pelos seguintes arquivos:

- `src/lib/databaseConfig.ts`: Configuração do cliente Supabase
- `src/lib/initDatabase.ts`: Funções para inicializar o banco e criar dados de teste
- `src/lib/setupDatabase.ts`: Função para inicializar o banco na inicialização
- `src/types/database.types.ts`: Tipos TypeScript para as tabelas do banco

## Verificação da Configuração

Para verificar se o banco de dados está configurado corretamente, acesse o painel do Supabase e verifique:

1. Se todas as tabelas foram criadas
2. Se as políticas de segurança (RLS) estão ativas
3. Se o ambiente de desenvolvimento possui os dados de teste

## Troubleshooting

### Problemas comuns

1. **Erro ao conectar ao Supabase**
   - Verifique se as variáveis de ambiente estão configuradas corretamente
   - Confirme se o projeto Supabase está ativo

2. **Tabelas não criadas**
   - Verifique os logs do servidor
   - Execute manualmente o script de migração no SQL Editor do Supabase

3. **Erro de permissão**
   - Verifique se a chave SUPABASE_SERVICE_ROLE_KEY está configurada corretamente
   - Confirme se as políticas RLS estão configuradas 