import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-middleware';
import { getDbPool } from '@/lib/database';
import { z } from 'zod';

// Tipos para geocercas
interface GeoPoint {
  lat: number;
  lng: number;
}

interface GeofenceCircle {
  id: string;
  name: string;
  type: 'circle';
  center: GeoPoint;
  radius: number;
  user_id: string;
}

interface GeofencePolygon {
  id: string;
  name: string;
  type: 'polygon';
  paths: GeoPoint[];
  user_id: string;
}

type Geofence = GeofenceCircle | GeofencePolygon;

// Esquema para validar parâmetros de consulta
const querySchema = z.object({
  vehicleId: z.string().uuid('ID do veículo inválido'),
  lat: z.string().transform(val => parseFloat(val)),
  lng: z.string().transform(val => parseFloat(val)),
  geofenceId: z.string().uuid('ID da geocerca inválido').optional()
});

// Função para calcular se um ponto está dentro de um círculo
function isPointInCircle(
  pointLat: number, 
  pointLng: number, 
  circleLat: number, 
  circleLng: number, 
  radiusMeters: number
): boolean {
  // Calcular distância usando a fórmula de Haversine
  const R = 6371e3; // Raio da Terra em metros
  const φ1 = (pointLat * Math.PI) / 180;
  const φ2 = (circleLat * Math.PI) / 180;
  const Δφ = ((circleLat - pointLat) * Math.PI) / 180;
  const Δλ = ((circleLng - pointLng) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance <= radiusMeters;
}

// Função para calcular se um ponto está dentro de um polígono (Ray Casting Algorithm)
function isPointInPolygon(point: [number, number], polygon: [number, number][]): boolean {
  const [x, y] = point;
  let inside = false;
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    
    const intersect = ((yi > y) !== (yj > y)) &&
        (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    
    if (intersect) inside = !inside;
  }
  
  return inside;
}

// Handler para verificar se um veículo está dentro de geocercas
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação do usuário
    const authResult = await verifyAuth(request);
    if (!authResult.user) {
      return NextResponse.json({ error: authResult.error || 'Não autorizado' }, { status: authResult.status || 401 });
    }
    
    const userId = authResult.user.id;
    
    // Extrair e validar parâmetros de consulta
    const url = new URL(request.url);
    const queryResult = querySchema.safeParse(Object.fromEntries(url.searchParams.entries()));
    
    if (!queryResult.success) {
      return NextResponse.json({ 
        error: 'Parâmetros de consulta inválidos', 
        details: queryResult.error.format() 
      }, { status: 400 });
    }
    
    const { vehicleId, lat, lng, geofenceId } = queryResult.data;
    
    // Verificar se o veículo pertence ao usuário
    const pool = getDbPool();
    const vehicleQuery = `
      SELECT id FROM vehicles 
      WHERE id = $1 AND user_id = $2
    `;
    
    const vehicleResult = await pool.query(vehicleQuery, [vehicleId, userId]);
    
    if (!vehicleResult || vehicleResult.rows.length === 0) {
      return NextResponse.json({ error: 'Veículo não encontrado ou não pertence ao usuário' }, { status: 404 });
    }
    
    // Construir consulta para geocercas do usuário
    let geofenceQuery = `
      SELECT * FROM geofences 
      WHERE user_id = $1
    `;
    let params = [userId];
    
    // Se um ID de geocerca for especificado, filtrar apenas por essa geocerca
    if (geofenceId) {
      geofenceQuery += ' AND id = $2';
      params.push(geofenceId);
    }
    
    // Executar consulta
    const geofenceResult = await pool.query(geofenceQuery, params);
    
    if (!geofenceResult) {
      console.error('Erro ao buscar geocercas');
      return NextResponse.json({ error: 'Erro ao buscar geocercas' }, { status: 500 });
    }
    
    const geofences = geofenceResult.rows;
    
    if (!geofences || geofences.length === 0) {
      return NextResponse.json({ 
        inside: false,
        message: 'Nenhuma geocerca encontrada para verificação'
      });
    }
    
    // Verificar cada geocerca
    const insideGeofences = geofences.filter(geofence => {
      if (geofence.type === 'circle') {
        return isPointInCircle(
          lat, 
          lng, 
          geofence.center?.lat, 
          geofence.center?.lng, 
          geofence.radius || 100
        );
      } else if (geofence.type === 'polygon' && Array.isArray(geofence.paths)) {
        const polygon: [number, number][] = geofence.paths.map((p: GeoPoint) => [p.lat, p.lng]);
        return isPointInPolygon([lat, lng], polygon);
      }
      return false;
    });
    
    // Registrar a posição atual com informação de geocerca
    if (insideGeofences.length > 0) {
      const insertPositionQuery = `
        INSERT INTO positions (vehicle_id, lat, lng, timestamp, inside_geofence, geofence_ids)
        VALUES ($1, $2, $3, $4, $5, $6)
      `;
      
      await pool.query(insertPositionQuery, [
        vehicleId,
        lat,
        lng,
        new Date().toISOString(),
        true,
        JSON.stringify(insideGeofences.map(g => g.id))
      ]);
      
      // Verificar se é necessário disparar alertas
      const alertQuery = `
        SELECT * FROM alerts 
        WHERE vehicle_id = $1 AND type = $2 AND status = $3
      `;
      
      const alertResult = await pool.query(alertQuery, [vehicleId, 'geofence_entrance', 'active']);
      
      if (alertResult && alertResult.rows.length > 0) {
        // Código para disparar notificações de alerta aqui (implementação futura)
        console.log(`Alertas disparados para veículo ${vehicleId} em geocerca`);
      }
    } else {
      const insertPositionQuery = `
        INSERT INTO positions (vehicle_id, lat, lng, timestamp, inside_geofence)
        VALUES ($1, $2, $3, $4, $5)
      `;
      
      await pool.query(insertPositionQuery, [
        vehicleId,
        lat,
        lng,
        new Date().toISOString(),
        false
      ]);
    }
    
    return NextResponse.json({ 
      inside: insideGeofences.length > 0,
      count: insideGeofences.length,
      geofences: insideGeofences.map(g => ({
        id: g.id,
        name: g.name,
        type: g.type
      }))
    });
    
  } catch (error) {
    console.error('Erro ao verificar geocercas:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}