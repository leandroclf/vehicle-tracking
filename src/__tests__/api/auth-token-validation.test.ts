import { verifyToken, generateToken } from '../../lib/jwt';

// Extender o tipo global para incluir nossa flag de mock
declare global {
  var __MOCK_JWT_EXPIRED__: boolean;
}

// Mock do jsonwebtoken para o teste de token expirado
jest.mock('jsonwebtoken', () => {
  const originalModule = jest.requireActual('jsonwebtoken');
  return {
    ...originalModule,
    verify: jest.fn((token, secret) => {
      // Verificar se é o teste de token expirado
      if (global.__MOCK_JWT_EXPIRED__) {
        throw new Error('jwt expired');
      }
      // Caso contrário, usar a implementação original
      return originalModule.verify(token, secret);
    })
  };
});

describe('Testes de Validação de Token JWT', () => {
  // Restaurar mocks após cada teste
  afterEach(() => {
    global.__MOCK_JWT_EXPIRED__ = false;
  });

  // Teste de geração e verificação de token válido
  test('Deve gerar e verificar um token JWT válido', () => {
    const userData = { id: 'test-id', email: 'test@example.com', name: 'Test User' };
    const token = generateToken(userData);
    
    // Verificar se o token foi gerado
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    
    // Verificar se o token pode ser decodificado corretamente
    const decoded = verifyToken(token);
    expect(decoded).toBeDefined();
    expect(decoded).not.toBeNull();
    
    // Verificar se os dados do usuário estão corretos no token
    if (decoded) {
      expect(decoded.userId).toBe(userData.id);
      expect(decoded.email).toBe(userData.email);
      expect(decoded.name).toBe(userData.name);
    }
  });
  
  // Teste de rejeição de token inválido
  test('Deve rejeitar um token JWT inválido', () => {
    const invalidToken = 'invalid.token.format';
    const decoded = verifyToken(invalidToken);
    expect(decoded).toBeNull();
  });
  
  // Teste de rejeição de token expirado
  test('Deve rejeitar um token JWT expirado', () => {
    // Ativar o mock de token expirado
    global.__MOCK_JWT_EXPIRED__ = true;
    
    // Criar token normal
    const userData = { id: 'test-id', email: 'test@example.com', name: 'Test User' };
    const token = generateToken(userData);
    
    // Verificar que o token é rejeitado como expirado
    const decoded = verifyToken(token);
    expect(decoded).toBeNull();
  });
  
  // Teste de manipulação de token (alterando payload)
  test('Deve rejeitar um token com assinatura inválida', () => {
    const userData = { id: 'test-id', email: 'test@example.com', name: 'Test User' };
    const token = generateToken(userData);
    
    // Dividir o token em suas partes (header.payload.signature)
    const parts = token.split('.');
    expect(parts.length).toBe(3);
    
    // Decodificar o payload
    const decodedPayload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    
    // Modificar o payload
    decodedPayload.userId = 'hacker-id';
    
    // Recodificar o payload
    const modifiedPayload = Buffer.from(JSON.stringify(decodedPayload)).toString('base64')
      .replace(/=/g, ''); // Remover padding '='
    
    // Criar um token modificado (header original + payload modificado + assinatura original)
    const modifiedToken = `${parts[0]}.${modifiedPayload}.${parts[2]}`;
    
    // Verificar que o token modificado é rejeitado
    const decoded = verifyToken(modifiedToken);
    expect(decoded).toBeNull();
  });
}); 