# Implementação de Edge Functions do Supabase

## Visão Geral

Este documento descreve a implementação de Edge Functions do Supabase para processamento de eventos complexos no sistema de rastreamento veicular. As Edge Functions são funções serverless que permitem executar lógica personalizada próxima aos dados, reduzindo a latência e melhorando a performance.

## Casos de Uso

### 1. Processamento de Eventos de Geocerca

Quando um veículo entra ou sai de uma geocerca, uma Edge Function processa o evento e realiza as seguintes ações:

- Verifica as regras de notificação configuradas para a geocerca
- Gera alertas baseados nas regras configuradas
- Registra o evento no histórico de eventos
- Notifica os usuários relevantes em tempo real

```typescript
// supabase/functions/geofence-events/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { vehicleId, position, timestamp } = await req.json()
    
    // Criar cliente Supabase com a chave de serviço
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    
    // Buscar geocercas ativas
    const { data: geofences } = await supabaseAdmin
      .from('geofences')
      .select('*')
      .eq('active', true)
    
    // Verificar se o veículo está dentro de alguma geocerca
    const insideGeofences = geofences.filter(geofence => {
      // Lógica para verificar se o ponto está dentro do polígono da geocerca
      return isPointInPolygon(position, geofence.coordinates)
    })
    
    // Buscar o estado anterior do veículo
    const { data: vehicleState } = await supabaseAdmin
      .from('vehicle_states')
      .select('inside_geofences')
      .eq('vehicle_id', vehicleId)
      .single()
    
    // Identificar entradas e saídas de geocercas
    const previousGeofences = vehicleState?.inside_geofences || []
    const enteredGeofences = insideGeofences.filter(g => !previousGeofences.includes(g.id))
    const exitedGeofences = previousGeofences.filter(id => !insideGeofences.some(g => g.id === id))
    
    // Processar eventos de entrada
    for (const geofence of enteredGeofences) {
      // Registrar evento
      await supabaseAdmin.from('geofence_events').insert({
        vehicle_id: vehicleId,
        geofence_id: geofence.id,
        event_type: 'enter',
        position,
        timestamp
      })
      
      // Gerar alertas conforme configuração
      if (geofence.alert_on_enter) {
        await supabaseAdmin.from('alerts').insert({
          type: 'geofence_enter',
          vehicle_id: vehicleId,
          geofence_id: geofence.id,
          message: `Veículo entrou na geocerca ${geofence.name}`,
          position,
          timestamp
        })
      }
    }
    
    // Processar eventos de saída
    for (const geofenceId of exitedGeofences) {
      const geofence = geofences.find(g => g.id === geofenceId)
      if (!geofence) continue
      
      // Registrar evento
      await supabaseAdmin.from('geofence_events').insert({
        vehicle_id: vehicleId,
        geofence_id: geofenceId,
        event_type: 'exit',
        position,
        timestamp
      })
      
      // Gerar alertas conforme configuração
      if (geofence.alert_on_exit) {
        await supabaseAdmin.from('alerts').insert({
          type: 'geofence_exit',
          vehicle_id: vehicleId,
          geofence_id: geofenceId,
          message: `Veículo saiu da geocerca ${geofence.name}`,
          position,
          timestamp
        })
      }
    }
    
    // Atualizar estado do veículo
    await supabaseAdmin
      .from('vehicle_states')
      .upsert({
        vehicle_id: vehicleId,
        inside_geofences: insideGeofences.map(g => g.id),
        last_position: position,
        last_update: timestamp
      })
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})

// Função auxiliar para verificar se um ponto está dentro de um polígono
function isPointInPolygon(point, polygon) {
  // Implementação do algoritmo ray-casting
  // ...
}
```

### 2. Processamento de Alertas de Velocidade

Uma Edge Function monitora a velocidade dos veículos e gera alertas quando os limites são excedidos:

```typescript
// supabase/functions/speed-alerts/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { vehicleId, speed, position, timestamp } = await req.json()
    
    // Criar cliente Supabase com a chave de serviço
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    
    // Buscar configurações de alerta de velocidade para o veículo
    const { data: vehicle } = await supabaseAdmin
      .from('vehicles')
      .select('speed_limit, speed_alert_enabled')
      .eq('id', vehicleId)
      .single()
    
    // Verificar se o alerta de velocidade está habilitado e se o limite foi excedido
    if (vehicle?.speed_alert_enabled && speed > vehicle.speed_limit) {
      // Verificar se já existe um alerta de velocidade ativo para este veículo
      const { data: existingAlerts } = await supabaseAdmin
        .from('alerts')
        .select('id, created_at')
        .eq('vehicle_id', vehicleId)
        .eq('type', 'speed_limit')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
      
      // Só criar um novo alerta se não existir um recente (últimos 5 minutos)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
      if (!existingAlerts?.length || existingAlerts[0].created_at < fiveMinutesAgo) {
        // Criar alerta de velocidade
        await supabaseAdmin.from('alerts').insert({
          type: 'speed_limit',
          vehicle_id: vehicleId,
          message: `Veículo excedeu o limite de velocidade (${speed} km/h)`,
          details: {
            speed,
            limit: vehicle.speed_limit,
            exceeded_by: speed - vehicle.speed_limit
          },
          position,
          timestamp,
          status: 'active'
        })
      }
    }
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
```

### 3. Geração de Relatórios Agendados

Uma Edge Function gera relatórios agendados e os envia por e-mail:

```typescript
// supabase/functions/scheduled-reports/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { SmtpClient } from 'https://deno.land/x/smtp@v0.7.0/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Criar cliente Supabase com a chave de serviço
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    
    // Buscar relatórios agendados para hoje
    const today = new Date()
    const dayOfWeek = today.getDay() // 0 = Domingo, 1 = Segunda, ...
    const dayOfMonth = today.getDate() // 1-31
    
    const { data: scheduledReports } = await supabaseAdmin
      .from('report_schedules')
      .select('*, report_template:report_template_id(*), user:user_id(*)')
      .eq('active', true)
      .or(`frequency.eq.daily,and(frequency.eq.weekly,weekday.eq.${dayOfWeek}),and(frequency.eq.monthly,day.eq.${dayOfMonth})`)
    
    // Processar cada relatório agendado
    for (const schedule of scheduledReports || []) {
      // Gerar o relatório
      const reportData = await generateReport(supabaseAdmin, schedule.report_template, schedule.parameters)
      
      // Salvar o relatório gerado
      const { data: savedReport } = await supabaseAdmin
        .from('reports')
        .insert({
          name: `${schedule.report_template.name} - ${new Date().toLocaleDateString()}`,
          type: schedule.report_template.type,
          parameters: schedule.parameters,
          data: reportData,
          user_id: schedule.user_id,
          schedule_id: schedule.id
        })
        .select()
        .single()
      
      // Enviar por e-mail se configurado
      if (schedule.email_delivery && schedule.user.email) {
        await sendReportByEmail(schedule.user.email, savedReport)
      }
    }
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})

// Função para gerar o relatório baseado no template e parâmetros
async function generateReport(supabase, template, parameters) {
  // Implementação específica para cada tipo de relatório
  switch (template.type) {
    case 'vehicle_usage':
      return await generateVehicleUsageReport(supabase, parameters)
    case 'driver_performance':
      return await generateDriverPerformanceReport(supabase, parameters)
    case 'fuel_consumption':
      return await generateFuelConsumptionReport(supabase, parameters)
    default:
      throw new Error(`Tipo de relatório não suportado: ${template.type}`)
  }
}

// Função para enviar o relatório por e-mail
async function sendReportByEmail(email, report) {
  const client = new SmtpClient()
  
  await client.connectTLS({
    hostname: Deno.env.get('SMTP_HOST'),
    port: parseInt(Deno.env.get('SMTP_PORT') || '587'),
    username: Deno.env.get('SMTP_USERNAME'),
    password: Deno.env.get('SMTP_PASSWORD'),
  })
  
  await client.send({
    from: Deno.env.get('SMTP_FROM'),
    to: email,
    subject: `Relatório: ${report.name}`,
    content: `Seu relatório agendado está disponível. Acesse o sistema para visualizá-lo.`,
    html: `
      <h1>Relatório: ${report.name}</h1>
      <p>Seu relatório agendado está disponível.</p>
      <p><a href="${Deno.env.get('APP_URL')}/reports/${report.id}">Clique aqui para visualizar o relatório</a></p>
    `,
  })
  
  await client.close()
}

// Funções específicas para cada tipo de relatório
async function generateVehicleUsageReport(supabase, parameters) {
  // Implementação específica
  // ...
}

async function generateDriverPerformanceReport(supabase, parameters) {
  // Implementação específica
  // ...
}

async function generateFuelConsumptionReport(supabase, parameters) {
  // Implementação específica
  // ...
}
```

## Implantação de Edge Functions

### Pré-requisitos

1. CLI do Supabase instalado
2. Projeto Supabase configurado
3. Variáveis de ambiente configuradas

### Passos para Implantação

1. **Inicializar as funções no projeto**

```bash
supabase functions new geofence-events
supabase functions new speed-alerts
supabase functions new scheduled-reports
```

2. **Implementar as funções conforme os exemplos acima**

3. **Configurar segredos e variáveis de ambiente**

```bash
supabase secrets set SUPABASE_URL=https://seu-projeto.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=seu-service-role-key
supabase secrets set SMTP_HOST=smtp.example.com
supabase secrets set SMTP_PORT=587
supabase secrets set SMTP_USERNAME=user@example.com
supabase secrets set SMTP_PASSWORD=senha-segura
supabase secrets set SMTP_FROM=noreply@example.com
supabase secrets set APP_URL=https://seu-app.com
```

4. **Implantar as funções**

```bash
supabase functions deploy geofence-events
supabase functions deploy speed-alerts
supabase functions deploy scheduled-reports
```

5. **Configurar gatilhos para as funções**

Para a função de relatórios agendados, configurar um gatilho cron:

```sql
create extension if not exists pg_cron;

select cron.schedule(
  'daily-reports',
  '0 8 * * *',  -- Executar todos os dias às 8h
  $$
  select net.http_post(
    'https://seu-projeto.functions.supabase.co/scheduled-reports',
    '{}',
    '{"Content-Type": "application/json", "Authorization": "Bearer seu-anon-key"}'::jsonb
  );
  $$
);
```

## Integração com o Frontend

Para integrar as Edge Functions com o frontend, utilize o cliente Supabase:

```typescript
// Exemplo de chamada para a função de verificação de geocerca
const checkGeofence = async (vehicleId, position, timestamp) => {
  const { data, error } = await supabase.functions.invoke('geofence-events', {
    body: { vehicleId, position, timestamp }
  })
  
  if (error) {
    console.error('Erro ao processar evento de geocerca:', error)
    return false
  }
  
  return data.success
}

// Exemplo de chamada para a função de alerta de velocidade
const processSpeedAlert = async (vehicleId, speed, position, timestamp) => {
  const { data, error } = await supabase.functions.invoke('speed-alerts', {
    body: { vehicleId, speed, position, timestamp }
  })
  
  if (error) {
    console.error('Erro ao processar alerta de velocidade:', error)
    return false
  }
  
  return data.success
}
```

## Monitoramento e Depuração

Para monitorar e depurar as Edge Functions, utilize os logs do Supabase:

```bash
supabase functions logs geofence-events
supabase functions logs speed-alerts
supabase functions logs scheduled-reports
```

Também é possível visualizar os logs no painel de administração do Supabase, na seção de Edge Functions.

## Próximos Passos

1. **Implementar mais funções para casos de uso específicos**:
   - Processamento de comandos remotos para veículos
   - Análise de padrões de condução
   - Detecção de anomalias em tempo real

2. **Melhorar a performance**:
   - Otimizar consultas ao banco de dados
   - Implementar cache para dados frequentemente acessados
   - Utilizar filas para processamento assíncrono de tarefas pesadas

3. **Expandir a integração**:
   - Integrar com serviços externos (previsão do tempo, condições de tráfego)
   - Implementar webhooks para notificar sistemas externos
   - Desenvolver APIs para integração com aplicativos móveis