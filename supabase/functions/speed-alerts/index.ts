// Edge Function para processamento de alertas de velocidade
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SpeedEvent {
  vehicleId: string
  speed: number
  position: {
    latitude: number
    longitude: number
  }
  timestamp: string
}

serve(async (req) => {
  // Lidar com requisições OPTIONS para CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Criar cliente Supabase usando variáveis de ambiente
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Extrair dados da requisição
    const { vehicleId, speed, position, timestamp } = await req.json() as SpeedEvent

    // Validar dados de entrada
    if (!vehicleId || speed === undefined || !position || !timestamp) {
      return new Response(
        JSON.stringify({ error: 'Dados incompletos para processamento de alerta de velocidade' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Buscar configurações de limite de velocidade para o veículo
    const { data: vehicleData, error: vehicleError } = await supabaseClient
      .from('vehicles')
      .select('*')
      .eq('id', vehicleId)
      .single()

    if (vehicleError) {
      throw new Error(`Erro ao buscar dados do veículo: ${vehicleError.message}`)
    }

    // Verificar se o veículo tem um limite de velocidade configurado
    const speedLimit = vehicleData.speed_limit || 80 // Valor padrão se não configurado

    // Verificar se a velocidade atual excede o limite
    const isExceedingLimit = speed > speedLimit

    // Buscar o último alerta de velocidade para este veículo
    const { data: lastAlerts, error: alertsError } = await supabaseClient
      .from('speed_alerts')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .order('timestamp', { ascending: false })
      .limit(1)

    if (alertsError) {
      throw new Error(`Erro ao buscar alertas de velocidade: ${alertsError.message}`)
    }

    // Determinar se devemos criar um novo alerta
    let shouldCreateAlert = false
    const lastAlert = lastAlerts?.[0]

    if (isExceedingLimit) {
      // Se não há alerta anterior ou o último alerta foi há mais de 5 minutos
      if (!lastAlert) {
        shouldCreateAlert = true
      } else {
        const lastAlertTime = new Date(lastAlert.timestamp).getTime()
        const currentTime = new Date(timestamp).getTime()
        const timeDifference = currentTime - lastAlertTime
        
        // Criar novo alerta se o último foi há mais de 5 minutos (300000 ms)
        shouldCreateAlert = timeDifference > 300000
      }
    }

    // Registrar o evento de velocidade para histórico
    const { error: insertEventError } = await supabaseClient
      .from('speed_events')
      .insert({
        vehicle_id: vehicleId,
        speed,
        speed_limit: speedLimit,
        exceeding_limit: isExceedingLimit,
        position,
        timestamp
      })

    if (insertEventError) {
      throw new Error(`Erro ao inserir evento de velocidade: ${insertEventError.message}`)
    }

    // Criar alerta se necessário
    if (shouldCreateAlert) {
      const { error: insertAlertError } = await supabaseClient
        .from('speed_alerts')
        .insert({
          vehicle_id: vehicleId,
          speed,
          speed_limit: speedLimit,
          position,
          timestamp
        })

      if (insertAlertError) {
        throw new Error(`Erro ao inserir alerta de velocidade: ${insertAlertError.message}`)
      }

      // Criar notificação para o alerta de velocidade
      await supabaseClient
        .from('notifications')
        .insert({
          type: 'speed_alert',
          user_id: null, // Será preenchido por trigger no banco de dados
          title: 'Alerta de Excesso de Velocidade',
          message: `Veículo ${vehicleData.plate || vehicleId} excedeu o limite de velocidade: ${speed} km/h (limite: ${speedLimit} km/h)`,
          data: {
            vehicleId,
            speed,
            speedLimit,
            position,
            timestamp
          },
          read: false,
          created_at: new Date().toISOString()
        })
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        exceeding_limit: isExceedingLimit,
        alert_created: shouldCreateAlert,
        message: shouldCreateAlert 
          ? `Alerta de velocidade criado para o veículo ${vehicleId}` 
          : `Evento de velocidade processado para o veículo ${vehicleId}`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})