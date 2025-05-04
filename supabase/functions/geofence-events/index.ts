// Edge Function para processamento de eventos de geocerca
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GeofenceEvent {
  vehicleId: string
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
    const { vehicleId, position, timestamp } = await req.json() as GeofenceEvent

    // Validar dados de entrada
    if (!vehicleId || !position || !timestamp) {
      return new Response(
        JSON.stringify({ error: 'Dados incompletos para processamento de geocerca' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Buscar todas as geocercas ativas
    const { data: geofences, error: geofencesError } = await supabaseClient
      .from('geofences')
      .select('*')
      .eq('active', true)

    if (geofencesError) {
      throw new Error(`Erro ao buscar geocercas: ${geofencesError.message}`)
    }

    // Verificar se o veículo está dentro de alguma geocerca
    const insideGeofences = geofences.filter((geofence) => {
      // Implementação simplificada - na prática, usaria algoritmos mais complexos como ray casting
      // para polígonos ou cálculo de distância para círculos
      if (geofence.type === 'circle') {
        const distance = calculateDistance(
          position.latitude,
          position.longitude,
          geofence.center.latitude,
          geofence.center.longitude
        )
        return distance <= geofence.radius
      }
      return false
    })

    // Buscar o histórico de geocercas do veículo para determinar entrada/saída
    const { data: lastEvents, error: eventsError } = await supabaseClient
      .from('geofence_events')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .order('timestamp', { ascending: false })
      .limit(insideGeofences.length * 2) // Buscar eventos suficientes para cada geocerca

    if (eventsError) {
      throw new Error(`Erro ao buscar eventos de geocerca: ${eventsError.message}`)
    }

    // Processar eventos de entrada/saída para cada geocerca
    const newEvents = []
    for (const geofence of insideGeofences) {
      const lastEventForGeofence = lastEvents?.find(e => e.geofence_id === geofence.id)
      
      // Se não há evento anterior ou o último evento foi de saída, registrar entrada
      if (!lastEventForGeofence || lastEventForGeofence.event_type === 'exit') {
        newEvents.push({
          vehicle_id: vehicleId,
          geofence_id: geofence.id,
          event_type: 'enter',
          position,
          timestamp
        })
      }
    }

    // Verificar saídas de geocercas
    if (lastEvents) {
      const previousGeofenceIds = lastEvents
        .filter(e => e.event_type === 'enter')
        .map(e => e.geofence_id)
      
      const currentGeofenceIds = insideGeofences.map(g => g.id)
      
      // Identificar geocercas das quais o veículo saiu
      const exitedGeofenceIds = previousGeofenceIds.filter(
        id => !currentGeofenceIds.includes(id)
      )
      
      for (const geofenceId of exitedGeofenceIds) {
        newEvents.push({
          vehicle_id: vehicleId,
          geofence_id: geofenceId,
          event_type: 'exit',
          position,
          timestamp
        })
      }
    }

    // Registrar novos eventos no banco de dados
    if (newEvents.length > 0) {
      const { error: insertError } = await supabaseClient
        .from('geofence_events')
        .insert(newEvents)

      if (insertError) {
        throw new Error(`Erro ao inserir eventos de geocerca: ${insertError.message}`)
      }

      // Enviar notificações para eventos de geocerca
      for (const event of newEvents) {
        await supabaseClient
          .from('notifications')
          .insert({
            type: 'geofence',
            user_id: null, // Será preenchido por trigger no banco de dados
            title: `Evento de Geocerca: ${event.event_type === 'enter' ? 'Entrada' : 'Saída'}`,
            message: `Veículo ${vehicleId} ${event.event_type === 'enter' ? 'entrou na' : 'saiu da'} geocerca ID ${event.geofence_id}`,
            data: event,
            read: false,
            created_at: new Date().toISOString()
          })
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        events: newEvents,
        message: `Processados ${newEvents.length} eventos de geocerca`
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

// Função auxiliar para calcular distância entre dois pontos (fórmula de Haversine)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3 // Raio da Terra em metros
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c // Distância em metros
}