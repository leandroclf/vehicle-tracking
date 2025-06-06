# Testes de Proteção e Validação dos Endpoints da API

Este documento descreve como testar se todos os endpoints da API do Yukz estão adequadamente protegidos e validam corretamente os tokens de autenticação.

## Visão Geral

Os testes de proteção da API verificam três cenários principais:

1. **Rejeição de requisições sem token**: Endpoints protegidos devem retornar status 401 quando não há token
2. **Rejeição de requisições com token inválido**: Endpoints protegidos devem retornar status 401 para tokens inválidos
3. **Aceitação de requisições com token válido**: Endpoints protegidos devem permitir acesso com token válido

Além disso, os testes de validação verificam se os endpoints validam corretamente os dados de entrada, rejeitando inputs inválidos.

## Arquivos de Teste

Os principais arquivos de teste estão localizados em:

- `__tests__/api/api-endpoints-protection.test.ts`: Testa se os endpoints exigem autenticação
- `__tests__/api/api-validation.test.ts`: Testa se os endpoints validam corretamente os inputs
- `__tests__/api/auth-token-validation.test.ts`: Testa a validação de tokens JWT
- `__tests__/api/middleware-auth.test.ts`: Testa o middleware de autenticação

## Utilitários

Os testes utilizam funções utilitárias definidas em `src/lib/api-test-utils.ts`:

- `makeRequest`: Executa o handler do endpoint (arquivo `route.ts`) de forma direta
  usando `NextRequest`, retornando o status real, cabeçalhos e corpo. Ele aceita
  parâmetros para definir o método HTTP, corpo e se deve usar ou não um token
  válido.
- `testEndpointProtection`: Realiza um conjunto completo de testes de proteção em um endpoint
- `getValidToken`: Gera um token JWT válido para testes
- `getInvalidToken`: Retorna um token inválido para testes

## Como Executar os Testes

```bash
# Executar todos os testes da API
npm run test:api

# Testar apenas a proteção dos endpoints
npm run test:api:protection

# Testar apenas a validação de tokens JWT
npm run test:api:auth
```

## Adicionando Novos Endpoints aos Testes

Quando novos endpoints forem adicionados à API, eles devem ser incluídos na suíte de testes. Para isso:

1. Abra o arquivo `__tests__/api/api-endpoints-protection.test.ts`
2. Adicione o novo endpoint à lista `endpointsToTest` (para endpoints protegidos) ou `publicEndpoints` (para endpoints públicos):

```typescript
// Exemplo para adicionar um endpoint protegido
const endpointsToTest = [
  // ... endpoints existentes ...
  { 
    endpoint: '/novo-endpoint', 
    method: 'GET' as const,
    body: { param1: 'valor1' } // Se necessário
  },
];

// Exemplo para adicionar um endpoint público
const publicEndpoints = [
  // ... endpoints existentes ...
  { 
    endpoint: '/auth/novo-endpoint-publico', 
    method: 'POST' as const,
    body: { param1: 'valor1' } // Se necessário
  },
];
```

## Verificação de Cobertura

Para verificar a cobertura dos testes, execute:

```bash
npm run test:coverage
```

Isso gerará um relatório detalhando quais partes do código da API estão sendo testadas.

## Interpretando os Resultados

- **Sucesso**: Todos os testes passam, indicando que os endpoints estão adequadamente protegidos
- **Falha em `isProtectedNoToken`**: O endpoint está permitindo acesso sem token (vulnerabilidade)
- **Falha em `isProtectedInvalidToken`**: O endpoint está aceitando tokens inválidos (vulnerabilidade)
- **Falha em `isAccessibleWithToken`**: O endpoint está rejeitando tokens válidos (erro de configuração)

## Resolução de Problemas Comuns

### Erro de ESM no node-fetch

Se você encontrar erros relacionados a imports ESM com o node-fetch:

```
SyntaxError: Cannot use import statement outside a module
```

Existem duas soluções:

1. **Modificar transformIgnorePatterns no Jest**:
   ```js
   // jest.config.js
   transformIgnorePatterns: [
     "/node_modules/(?!(node-fetch)/)"
   ]
   ```

2. **Usar CommonJS para importar o fetch**:
   ```js
   // Em vez de
   import fetch from 'node-fetch';
   
   // Use
   const fetch = require('node-fetch');
   ```

### Falha nos testes de token expirado

Se os testes de token expirado estiverem falhando:

1. Use mocks do Jest para simular o comportamento da validação de tokens:
   ```js
   jest.mock('jsonwebtoken', () => {
     const originalModule = jest.requireActual('jsonwebtoken');
     return {
       ...originalModule,
       verify: jest.fn((token, secret) => {
         if (global.__MOCK_JWT_EXPIRED__) {
           throw new Error('jwt expired');
         }
         return originalModule.verify(token, secret);
       })
     };
   });
   ```

2. Configure a variável global em seus testes:
   ```js
   global.__MOCK_JWT_EXPIRED__ = true;
   ```

### Erro com path aliases (@/)

Se houver erros ao resolver caminhos com o alias @/:

1. Certifique-se de que o Jest está configurado corretamente:
   ```js
   // jest.config.js
   moduleNameMapper: {
     "^@/(.*)$": "<rootDir>/src/$1",
   }
   ```

2. Adicione o plugin de resolução de módulos ao Babel:
   ```js
   // babel.config.js
   plugins: [
     ['module-resolver', {
       alias: {
         '@': './src',
       },
     }],
   ]
   ```

## Recomendações

1. **Sempre adicione novos endpoints à suíte de testes**: Isso garante que a segurança da API seja mantida
2. **Execute os testes após alterações significativas**: Especialmente após mudanças no middleware de autenticação
3. **Mantenha os casos de teste atualizados**: Atualize os corpos de requisição (`body`) conforme necessário
4. **Verifique os logs de erro**: Os testes imprimem informações úteis para depuração 