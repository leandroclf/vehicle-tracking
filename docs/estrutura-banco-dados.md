# Estrutura do Banco de Dados - Yukz

Este documento descreve a estrutura do banco de dados utilizado na aplicação Yukz de rastreamento veicular, implementado no Supabase.

## Tabelas Principais

### users
Armazena informações dos usuários do sistema.

| Coluna         | Tipo                    | Descrição                                           |
|----------------|-------------------------|-----------------------------------------------------|
| id             | uuid                    | Identificador único (PK), gerado automaticamente    |
| name           | text                    | Nome completo do usuário                            |
| email          | text                    | Email do usuário (único)                            |
| password_hash  | text                    | Hash da senha (bcrypt)                              |
| user_type      | text                    | Tipo de usuário: 'individual', 'small_fleet' ou 'large_fleet' |
| phone          | text                    | Número de telefone (opcional)                       |
| created_at     | timestamp with time zone| Data de criação do registro                         |
| updated_at     | timestamp with time zone| Data da última atualização                          |

### vehicles
Armazena informações dos veículos cadastrados.

| Coluna         | Tipo                    | Descrição                                           |
|----------------|-------------------------|-----------------------------------------------------|
| id             | uuid                    | Identificador único (PK), gerado automaticamente    |
| user_id        | uuid                    | ID do usuário proprietário (FK → users.id)          |
| name           | text                    | Nome do veículo                                     |
| type           | text                    | Tipo: 'car', 'motorcycle', 'truck', 'boat', 'jetski'|
| license_plate  | text                    | Placa do veículo (opcional)                         |
| brand          | text                    | Marca do veículo (opcional)                         |
| model          | text                    | Modelo do veículo (opcional)                        |
| year           | integer                 | Ano de fabricação (opcional)                        |
| color          | text                    | Cor do veículo (opcional)                           |
| active         | boolean                 | Status do veículo (ativo/inativo)                   |
| created_at     | timestamp with time zone| Data de criação do registro                         |
| updated_at     | timestamp with time zone| Data da última atualização                          |

### trackers
Armazena informações dos dispositivos rastreadores.

| Coluna         | Tipo                    | Descrição                                           |
|----------------|-------------------------|-----------------------------------------------------|
| id             | uuid                    | Identificador único (PK), gerado automaticamente    |
| vehicle_id     | uuid                    | ID do veículo associado (FK → vehicles.id)          |
| imei           | text                    | Número IMEI do rastreador (único)                   |
| protocol       | text                    | Protocolo utilizado pelo rastreador                 |
| installed_at   | timestamp with time zone| Data de instalação                                  |
| active         | boolean                 | Status do rastreador (ativo/inativo)                |
| created_at     | timestamp with time zone| Data de criação do registro                         |
| updated_at     | timestamp with time zone| Data da última atualização                          |

### positions
Armazena as posições dos veículos.

| Coluna         | Tipo                    | Descrição                                           |
|----------------|-------------------------|-----------------------------------------------------|
| id             | uuid                    | Identificador único (PK), gerado automaticamente    |
| vehicle_id     | uuid                    | ID do veículo (FK → vehicles.id)                    |
| latitude       | double precision        | Latitude da posição                                 |
| longitude      | double precision        | Longitude da posição                                |
| speed          | double precision        | Velocidade (km/h)                                   |
| direction      | integer                 | Direção em graus (0-359)                            |
| ignition       | boolean                 | Status da ignição (ligada/desligada)                |
| satellites     | integer                 | Número de satélites usados para fix                 |
| battery_level  | integer                 | Nível da bateria (0-100)                            |
| timestamp      | timestamp with time zone| Data/hora da posição                                |
| created_at     | timestamp with time zone| Data de criação do registro                         |

### events
Armazena eventos relacionados aos veículos.

| Coluna         | Tipo                    | Descrição                                           |
|----------------|-------------------------|-----------------------------------------------------|
| id             | uuid                    | Identificador único (PK), gerado automaticamente    |
| vehicle_id     | uuid                    | ID do veículo (FK → vehicles.id)                    |
| type           | text                    | Tipo do evento: 'ignition_on', 'ignition_off', etc. |
| description    | text                    | Descrição detalhada do evento (opcional)            |
| read           | boolean                 | Indica se o evento foi lido                         |
| timestamp      | timestamp with time zone| Data/hora do evento                                 |
| created_at     | timestamp with time zone| Data de criação do registro                         |

### fences
Armazena informações das geocercas.

| Coluna         | Tipo                    | Descrição                                           |
|----------------|-------------------------|-----------------------------------------------------|
| id             | uuid                    | Identificador único (PK), gerado automaticamente    |
| user_id        | uuid                    | ID do usuário proprietário (FK → users.id)          |
| name           | text                    | Nome da geocerca                                    |
| type           | text                    | Tipo: 'circle' ou 'polygon'                         |
| coordinates    | jsonb                   | Coordenadas da geocerca                             |
| created_at     | timestamp with time zone| Data de criação do registro                         |
| updated_at     | timestamp with time zone| Data da última atualização                          |

### maintenance
Armazena registros de manutenção dos veículos.

| Coluna         | Tipo                    | Descrição                                           |
|----------------|-------------------------|-----------------------------------------------------|
| id             | uuid                    | Identificador único (PK), gerado automaticamente    |
| vehicle_id     | uuid                    | ID do veículo (FK → vehicles.id)                    |
| type           | text                    | Tipo de manutenção                                  |
| scheduled_date | timestamp with time zone| Data programada                                     |
| status         | text                    | Status: 'pending', 'completed', 'overdue'           |
| created_at     | timestamp with time zone| Data de criação do registro                         |
| updated_at     | timestamp with time zone| Data da última atualização                          |

### reports
Armazena informações sobre relatórios gerados.

| Coluna         | Tipo                    | Descrição                                           |
|----------------|-------------------------|-----------------------------------------------------|
| id             | uuid                    | Identificador único (PK), gerado automaticamente    |
| user_id        | uuid                    | ID do usuário (FK → users.id)                       |
| type           | text                    | Tipo: 'daily', 'weekly', 'monthly', 'custom'        |
| status         | text                    | Status: 'pending', 'processing', 'completed', 'failed' |
| file_path      | text                    | Caminho do arquivo de relatório                     |
| start_date     | timestamp with time zone| Data inicial do período                             |
| end_date       | timestamp with time zone| Data final do período                               |
| created_at     | timestamp with time zone| Data de criação do registro                         |
| updated_at     | timestamp with time zone| Data da última atualização                          |

### commands
Armazena comandos enviados aos veículos.

| Coluna         | Tipo                    | Descrição                                           |
|----------------|-------------------------|-----------------------------------------------------|
| id             | uuid                    | Identificador único (PK), gerado automaticamente    |
| vehicle_id     | uuid                    | ID do veículo (FK → vehicles.id)                    |
| type           | text                    | Tipo: 'block_engine', 'unblock_engine'              |
| status         | text                    | Status: 'pending', 'sent', 'executed', 'failed'     |
| sent_at        | timestamp with time zone| Data/hora de envio                                  |
| executed_at    | timestamp with time zone| Data/hora de execução                               |
| created_at     | timestamp with time zone| Data de criação do registro                         |
| updated_at     | timestamp with time zone| Data da última atualização                          |

## Relações entre Tabelas

- users → vehicles (1:N): Um usuário pode ter vários veículos
- vehicles → trackers (1:1): Um veículo tem um rastreador
- vehicles → positions (1:N): Um veículo tem várias posições
- vehicles → events (1:N): Um veículo tem vários eventos
- vehicles → commands (1:N): Um veículo recebe vários comandos
- vehicles → maintenance (1:N): Um veículo tem vários registros de manutenção
- users → fences (1:N): Um usuário pode ter várias geocercas
- users → reports (1:N): Um usuário pode gerar vários relatórios

## Políticas de Segurança (RLS)

Todas as tabelas têm Row Level Security (RLS) habilitado para garantir que os usuários só possam acessar seus próprios dados:

- Em tabelas vinculadas diretamente a users (vehicles, fences, reports): acesso restrito pelo user_id
- Em tabelas vinculadas indiretamente a users (positions, events, trackers, maintenance, commands): acesso restrito pelo vehicle_id que por sua vez está vinculado a um user_id

## Migrations

As migrações do banco de dados são mantidas em arquivos SQL:

1. `20250427035130_create_initial_tables`: Criação da estrutura inicial de tabelas
2. `20250427040940_update_events_constraint`: Atualização das restrições na tabela events 