'use client';

interface JwtPayload {
  userId: string;
  email: string;
  name: string;
}

/**
 * Extrai as informações do token JWT.
 * Nota: Esta função não verifica a assinatura do token pois isso deve ser feito no servidor.
 * Apenas extrai os dados para uso no cliente.
 * 
 * @param token - O token JWT
 * @returns O payload decodificado ou null se inválido
 */
export function verifyToken(token: string): JwtPayload | null {
  try {
    // Dividir o token em partes
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('Token inválido: formato incorreto');
      return null;
    }

    // Decodificar a parte do payload (segunda parte)
    // Usar base64 seguro para URL (substituir caracteres não compatíveis)
    const base64Url = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const base64 = base64Url.padEnd(base64Url.length + (4 - base64Url.length % 4) % 4, '=');
    const payload = JSON.parse(atob(base64));
    console.log('Token decodificado:', payload);
    
    // Verificar se o token expirou
    if (payload.exp) {
      const expiryTime = payload.exp * 1000; // Converter para milissegundos
      if (Date.now() >= expiryTime) {
        console.error('Token expirado');
        return null;
      }
    }

    // Garantir que estamos usando as mesmas propriedades definidas no servidor
    return {
      userId: payload.userId || payload.sub, // Compatibilidade com diferentes formatos
      email: payload.email,
      name: payload.name
    };
  } catch (error) {
    console.error('Erro ao decodificar token:', error);
    return null;
  }
}