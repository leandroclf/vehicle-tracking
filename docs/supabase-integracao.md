# Integração com Supabase

O Yukz utiliza o Supabase como plataforma principal de backend, aproveitando suas funcionalidades de banco de dados, autenticação, armazenamento e updates em tempo real.

## Visão Geral

O Supabase é uma alternativa open-source ao Firebase, oferecendo uma plataforma de desenvolvimento completa construída em cima do PostgreSQL. No contexto do Yukz, o Supabase é utilizado para:

1. **Armazenamento de Dados**: Banco de dados relacional para todos os dados da aplicação
2. **Autenticação e Autorização**: Gerenciamento de usuários e políticas de segurança
3. **Comunicação em Tempo Real**: Atualização instantânea de dados na interface
4. **Armazenamento de Arquivos**: Armazenamento de relatórios e imagens

## Configuração do Cliente

O sistema utiliza dois tipos de clientes Supabase:

### Cliente Padrão (Frontend)

Configurado com a chave anônima para operações do usuário final:

```typescript
// src/lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### Cliente Admin (Backend)

Configurado com a chave de serviço para operações privilegiadas no servidor:

```typescript
// Apenas disponível no servidor
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;
```

## Modelo de Dados

O esquema do banco de dados está estruturado em diversas tabelas principais:

### Tabelas Principais

| Tabela | Descrição | Principais Campos |
|--------|-----------|-------------------|
| profiles | Perfis de usuário | id, name, phone, updated_at |
| vehicles | Informações dos veículos | id, user_id, name, type, plate, model, device_imei |
| vehicle_status | Status atual dos veículos | vehicle_id, status, lat, lng, speed, ignition |
| trips | Registros de viagens | vehicle_id, start_time, end_time, distance |
| events | Eventos de telemetria | vehicle_id, type, timestamp, lat, lng |
| alerts | Alertas gerados | user_id, vehicle_id, type, message, read |
| settings | Configurações do usuário | user_id, notifications_enabled, speed_alert_value |
| geofences | Geocercas | id, user_id, name, type, coordinates |

### Relações Principais

- Um usuário pode ter múltiplos veículos
- Um veículo tem um status atual
- Um veículo pode ter múltiplas viagens
- Um veículo pode gerar múltiplos eventos e alertas
- Um usuário pode ter múltiplas geocercas

## Políticas de Segurança (RLS)

O Supabase utiliza Row Level Security (RLS) do PostgreSQL para garantir que os usuários só possam acessar seus próprios dados. Abaixo estão as políticas principais implementadas:

### Exemplo de Política para Veículos

```sql
-- Política para leitura
CREATE POLICY "Users can view their own vehicles" ON public.vehicles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política para inserção
CREATE POLICY "Users can add their own vehicles" ON public.vehicles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política para atualização
CREATE POLICY "Users can update their own vehicles" ON public.vehicles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Política para remoção
CREATE POLICY "Users can delete their own vehicles" ON public.vehicles
  FOR DELETE
  USING (auth.uid() = user_id);
```

## Autenticação

O sistema utiliza a autenticação nativa do Supabase, que oferece:

- Login com email/senha
- Confirmação de email
- Recuperação de senha
- Tokens JWT para autorização

### Fluxo de Autenticação

1. Usuário se registra ou faz login através do frontend
2. Supabase valida as credenciais e gera um token JWT
3. Token é armazenado localmente (localStorage ou cookies)
4. Requisições subsequentes incluem o token para autenticação
5. Servidor valida o token e aplica as políticas de RLS

## Manipulação de Dados

### Exemplo de Consulta de Veículos

```typescript
// Buscar veículos do usuário logado
async function getVehicles() {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .order('name', { ascending: true });
    
  if (error) {
    console.error('Erro ao buscar veículos:', error);
    return [];
  }
  
  return data || [];
}
```

### Exemplo de Inserção de Dados

```typescript
// Adicionar um novo veículo
async function addVehicle(vehicleData) {
  const { data, error } = await supabase
    .from('vehicles')
    .insert([
      { 
        ...vehicleData,
        // user_id é definido automaticamente pelo RLS
      }
    ])
    .select();
    
  if (error) {
    console.error('Erro ao adicionar veículo:', error);
    return null;
  }
  
  return data?.[0] || null;
}
```

## Funções do Servidor (Próximo Passo)

O Supabase permite a criação de funções PostgreSQL que podem ser usadas para lógica de negócios no servidor:

```sql
-- Exemplo de função para calcular distância de viagem
CREATE OR REPLACE FUNCTION calculate_trip_distance(trip_id INT)
RETURNS FLOAT AS $$
DECLARE
  total_distance FLOAT := 0;
  prev_lat FLOAT;
  prev_lng FLOAT;
  curr_lat FLOAT;
  curr_lng FLOAT;
BEGIN
  -- Lógica para calcular distância entre pontos GPS
  -- ...
  RETURN total_distance;
END;
$$ LANGUAGE plpgsql;
```

## Migração de Banco de Dados

O Yukz mantém scripts de migração para evolução do esquema:

```bash
migrations/
  ├── 0001_initial_schema.sql      # Esquema inicial
  ├── 0002_add_vehicle_features.sql # Novas funcionalidades
  └── 0003_add_report_tables.sql   # Tabelas de relatórios
```

Para aplicar migrações:

1. Acesse o Editor SQL do painel do Supabase
2. Copie e cole o conteúdo do arquivo de migração
3. Execute o script

## Realtime (Tempo Real)

O Supabase oferece funcionalidades de tempo real baseadas em WebSockets e PostgreSQL's LISTEN/NOTIFY:

```typescript
// Escutar por mudanças na tabela vehicle_status
const subscription = supabase
  .from('vehicle_status')
  .on('UPDATE', payload => {
    console.log('Atualização de veículo:', payload.new);
    // Atualizar interface
  })
  .subscribe();

// Limpeza ao desmontar componente
return () => {
  supabase.removeSubscription(subscription);
};
```

## Otimizações e Boas Práticas

1. **Consultas Otimizadas**: Sempre selecionar apenas os campos necessários
   ```typescript
   .select('id, name, plate, lat, lng, speed')  // Melhor que select('*')
   ```

2. **Paginação**: Limitar resultados para melhor performance
   ```typescript
   .range(0, 9)  // Primeiros 10 resultados
   ```

3. **Índices**: Criar índices para campos frequentemente consultados
   ```sql
   CREATE INDEX idx_vehicle_status_vehicle_id ON vehicle_status(vehicle_id);
   ```

4. **Transações**: Usar transações para operações que envolvem múltiplas tabelas
   ```typescript
   const { error } = await supabase.rpc('update_vehicle_and_log', { 
     vehicle_id, new_status, log_message 
   });
   ```

## Próximos Passos de Integração

1. **Implementar Edge Functions**: Utilizar funções serverless do Supabase para lógica complexa
2. **Realtime para Rastreamento**: Melhorar a experiência com atualizações em tempo real
3. **Storage para Relatórios**: Armazenar relatórios gerados no Storage do Supabase
4. **Webhooks**: Configurar webhooks para integrações com sistemas externos
5. **Backup Automatizado**: Configurar backups regulares do banco de dados

## Referências

- [Documentação Oficial do Supabase](https://supabase.com/docs)
- [Guia de Autenticação](https://supabase.com/docs/guides/auth)
- [Guia de Banco de Dados](https://supabase.com/docs/guides/database)
- [Guia de Row Level Security](https://supabase.com/docs/guides/auth/row-level-security) 