# 5. API e Endpoints

O sistema Yukz fornece uma API RESTful para acesso às suas funcionalidades. Todos os endpoints (exceto autenticação) requerem um token JWT válido no cabeçalho de autorização.

## 5.1 Convenções da API

- **Base URL**: `/api`
- **Formato de Dados**: JSON
- **Autenticação**: Bearer Token JWT
- **Cabeçalhos Comuns**:
  - `Content-Type: application/json`
  - `Authorization: Bearer <token_jwt>`
- **Códigos de Status HTTP**:
  - `200 OK`: Requisição bem-sucedida
  - `201 Created`: Recurso criado com sucesso
  - `400 Bad Request`: Erro de validação ou parâmetros inválidos
  - `401 Unauthorized`: Token ausente ou inválido
  - `403 Forbidden`: Sem permissão para acessar o recurso
  - `404 Not Found`: Recurso não encontrado
  - `500 Internal Server Error`: Erro interno do servidor

## 5.2 Autenticação

### 5.2.1 Login

Autentica um usuário e retorna um token JWT.

- **URL**: `/api/auth/login`
- **Método**: `POST`
- **Autenticação Requerida**: Não
- **Corpo da Requisição**:
  ```json
  {
    "email": "usuario@exemplo.com",
    "password": "senha123"
  }
  ```
- **Resposta de Sucesso** (200 OK):
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "email": "usuario@exemplo.com",
      "name": "Nome do Usuário"
    }
  }
  ```
- **Resposta de Erro** (401 Unauthorized):
  ```json
  {
    "error": "Credenciais inválidas"
  }
  ```

### 5.2.2 Registro

Cria um novo usuário no sistema.

- **URL**: `/api/auth/register`
- **Método**: `POST`
- **Autenticação Requerida**: Não
- **Corpo da Requisição**:
  ```json
  {
    "name": "Nome do Usuário",
    "email": "usuario@exemplo.com",
    "password": "senha123",
    "confirmPassword": "senha123"
  }
  ```
- **Resposta de Sucesso** (201 Created):
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "email": "usuario@exemplo.com",
      "name": "Nome do Usuário"
    }
  }
  ```
- **Resposta de Erro** (400 Bad Request):
  ```json
  {
    "error": "E-mail já cadastrado"
  }
  ```

## 5.3 Veículos

### 5.3.1 Listar Veículos

Retorna a lista de veículos do usuário autenticado.

- **URL**: `/api/vehicles`
- **Método**: `GET`
- **Autenticação Requerida**: Sim
- **Parâmetros de Query**:
  - `status` (opcional): Filtrar por status (`active`, `inactive`, `all`)
  - `sort` (opcional): Ordenar por campo (`name`, `plate`, `lastUpdate`)
  - `order` (opcional): Direção da ordenação (`asc`, `desc`)
- **Resposta de Sucesso** (200 OK):
  ```json
  {
    "vehicles": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "name": "Caminhão 01",
        "plate": "ABC1234",
        "model": "Volvo FH 540",
        "year": 2022,
        "status": "active",
        "lastPosition": {
          "latitude": -23.5505,
          "longitude": -46.6333,
          "timestamp": "2025-02-15T14:30:00Z",
          "speed": 60,
          "ignition": true
        }
      },
      // ... mais veículos
    ]
  }
  ```

### 5.3.2 Obter Veículo

Retorna detalhes de um veículo específico.

- **URL**: `/api/vehicles/{id}`
- **Método**: `GET`
- **Autenticação Requerida**: Sim
- **Resposta de Sucesso** (200 OK):
  ```json
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Caminhão 01",
    "plate": "ABC1234",
    "model": "Volvo FH 540",
    "year": 2022,
    "status": "active",
    "deviceId": "567e4567-e89b-12d3-a456-426614174000",
    "lastPosition": {
      "latitude": -23.5505,
      "longitude": -46.6333,
      "timestamp": "2025-02-15T14:30:00Z",
      "speed": 60,
      "ignition": true,
      "heading": 90,
      "altitude": 800,
      "satellites": 9,
      "battery": 12.4
    }
  }
  ```
- **Resposta de Erro** (404 Not Found):
  ```json
  {
    "error": "Veículo não encontrado"
  }
  ```

### 5.3.3 Adicionar Veículo

Adiciona um novo veículo ao usuário autenticado.

- **URL**: `/api/vehicles`
- **Método**: `POST`
- **Autenticação Requerida**: Sim
- **Corpo da Requisição**:
  ```json
  {
    "name": "Caminhão 01",
    "plate": "ABC1234",
    "model": "Volvo FH 540",
    "year": 2022,
    "color": "#FF0000",
    "deviceId": "567e4567-e89b-12d3-a456-426614174000"
  }
  ```
- **Resposta de Sucesso** (201 Created):
  ```json
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Caminhão 01",
    "plate": "ABC1234",
    "model": "Volvo FH 540",
    "year": 2022,
    "status": "active",
    "deviceId": "567e4567-e89b-12d3-a456-426614174000"
  }
  ```

### 5.3.4 Atualizar Veículo

Atualiza um veículo existente.

- **URL**: `/api/vehicles/{id}`
- **Método**: `PUT`
- **Autenticação Requerida**: Sim
- **Corpo da Requisição**:
  ```json
  {
    "name": "Caminhão 01 (Atualizado)",
    "model": "Volvo FH 540",
    "year": 2022,
    "color": "#0000FF"
  }
  ```
- **Resposta de Sucesso** (200 OK):
  ```json
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Caminhão 01 (Atualizado)",
    "plate": "ABC1234",
    "model": "Volvo FH 540",
    "year": 2022,
    "status": "active",
    "color": "#0000FF"
  }
  ```

### 5.3.5 Excluir Veículo

Remove um veículo do sistema.

- **URL**: `/api/vehicles/{id}`
- **Método**: `DELETE`
- **Autenticação Requerida**: Sim
- **Resposta de Sucesso** (200 OK):
  ```json
  {
    "message": "Veículo removido com sucesso"
  }
  ```

## 5.4 Geocercas

### 5.4.1 Listar Geocercas

Retorna a lista de geocercas do usuário.

- **URL**: `/api/geofences`
- **Método**: `GET`
- **Autenticação Requerida**: Sim
- **Resposta de Sucesso** (200 OK):
  ```json
  {
    "geofences": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "name": "Depósito Central",
        "type": "circle",
        "radius": 500,
        "center": {
          "latitude": -23.5505,
          "longitude": -46.6333
        },
        "color": "#FF0000",
        "alertOnEnter": true,
        "alertOnExit": true
      },
      {
        "id": "223e4567-e89b-12d3-a456-426614174000",
        "name": "Zona de Entrega",
        "type": "polygon",
        "points": [
          {"latitude": -23.5505, "longitude": -46.6333},
          {"latitude": -23.5605, "longitude": -46.6433},
          {"latitude": -23.5705, "longitude": -46.6233}
        ],
        "color": "#00FF00",
        "alertOnEnter": true,
        "alertOnExit": false
      }
    ]
  }
  ```

### 5.4.2 Adicionar Geocerca

Adiciona uma nova geocerca.

- **URL**: `/api/geofences`
- **Método**: `POST`
- **Autenticação Requerida**: Sim
- **Corpo da Requisição (Circular)**:
  ```json
  {
    "name": "Depósito Central",
    "type": "circle",
    "radius": 500,
    "center": {
      "latitude": -23.5505,
      "longitude": -46.6333
    },
    "color": "#FF0000",
    "alertOnEnter": true,
    "alertOnExit": true,
    "vehicles": ["123e4567-e89b-12d3-a456-426614174000"]
  }
  ```
- **Corpo da Requisição (Poligonal)**:
  ```json
  {
    "name": "Zona de Entrega",
    "type": "polygon",
    "points": [
      {"latitude": -23.5505, "longitude": -46.6333},
      {"latitude": -23.5605, "longitude": -46.6433},
      {"latitude": -23.5705, "longitude": -46.6233}
    ],
    "color": "#00FF00",
    "alertOnEnter": true,
    "alertOnExit": false,
    "vehicles": ["123e4567-e89b-12d3-a456-426614174000"]
  }
  ```
- **Resposta de Sucesso** (201 Created):
  ```json
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Depósito Central",
    "type": "circle",
    "radius": 500,
    "center": {
      "latitude": -23.5505,
      "longitude": -46.6333
    },
    "color": "#FF0000",
    "alertOnEnter": true,
    "alertOnExit": true,
    "vehicles": ["123e4567-e89b-12d3-a456-426614174000"]
  }
  ```

## 5.5 Alertas

### 5.5.1 Listar Alertas

Retorna os alertas do usuário.

- **URL**: `/api/alerts`
- **Método**: `GET`
- **Autenticação Requerida**: Sim
- **Parâmetros de Query**:
  - `read` (opcional): Filtrar por status de leitura (`true`, `false`, `all`)
  - `type` (opcional): Filtrar por tipo (`geofence`, `speed`, `ignition`, `all`)
  - `vehicle` (opcional): ID do veículo
  - `limit` (opcional): Número máximo de alertas a retornar
  - `offset` (opcional): Offset para paginação
- **Resposta de Sucesso** (200 OK):
  ```json
  {
    "alerts": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "type": "geofence",
        "subtype": "entry",
        "message": "Veículo ABC1234 entrou na geocerca 'Depósito Central'",
        "timestamp": "2025-02-15T14:30:00Z",
        "read": false,
        "vehicle": {
          "id": "123e4567-e89b-12d3-a456-426614174000",
          "name": "Caminhão 01",
          "plate": "ABC1234"
        },
        "position": {
          "latitude": -23.5505,
          "longitude": -46.6333
        },
        "geofence": {
          "id": "123e4567-e89b-12d3-a456-426614174000",
          "name": "Depósito Central"
        }
      },
      // ... mais alertas
    ],
    "pagination": {
      "total": 42,
      "limit": 10,
      "offset": 0
    }
  }
  ```

### 5.5.2 Marcar Alerta como Lido

Marca um alerta específico como lido.

- **URL**: `/api/alerts/{id}/read`
- **Método**: `PUT`
- **Autenticação Requerida**: Sim
- **Resposta de Sucesso** (200 OK):
  ```json
  {
    "message": "Alerta marcado como lido"
  }
  ```

### 5.5.3 Marcar Todos os Alertas como Lidos

Marca todos os alertas do usuário como lidos.

- **URL**: `/api/alerts/read-all`
- **Método**: `PUT`
- **Autenticação Requerida**: Sim
- **Resposta de Sucesso** (200 OK):
  ```json
  {
    "message": "Todos os alertas marcados como lidos",
    "count": 15
  }
  ```

## 5.6 Configurações

### 5.6.1 Obter Configurações

Retorna as configurações do usuário autenticado.

- **URL**: `/api/settings`
- **Método**: `GET`
- **Autenticação Requerida**: Sim
- **Resposta de Sucesso** (200 OK):
  ```json
  {
    "mapSettings": {
      "defaultCenter": {
        "latitude": -23.5505,
        "longitude": -46.6333
      },
      "defaultZoom": 12,
      "showTraffic": true,
      "mapType": "roadmap"
    },
    "alertSettings": {
      "speedAlertThreshold": 80,
      "enableSpeedAlerts": true,
      "enableGeofenceAlerts": true,
      "enableIgnitionAlerts": true,
      "notificationEmail": "usuario@exemplo.com",
      "emailNotifications": true,
      "pushNotifications": true
    },
    "uiSettings": {
      "theme": "dark",
      "language": "pt-BR",
      "timeFormat": "24h",
      "distanceUnit": "km",
      "speedUnit": "km/h"
    }
  }
  ```

### 5.6.2 Atualizar Configurações

Atualiza as configurações do usuário.

- **URL**: `/api/settings`
- **Método**: `PUT`
- **Autenticação Requerida**: Sim
- **Corpo da Requisição**:
  ```json
  {
    "mapSettings": {
      "defaultZoom": 14,
      "showTraffic": false,
      "mapType": "satellite"
    },
    "alertSettings": {
      "enableSpeedAlerts": false,
      "speedAlertThreshold": 90
    }
  }
  ```
- **Resposta de Sucesso** (200 OK):
  ```json
  {
    "message": "Configurações atualizadas com sucesso"
  }
  ```

## 5.7 Histórico de Posições

### 5.7.1 Obter Histórico de Posições

Retorna o histórico de posições de um veículo em um período específico.

- **URL**: `/api/vehicles/{id}/positions`
- **Método**: `GET`
- **Autenticação Requerida**: Sim
- **Parâmetros de Query**:
  - `start` (obrigatório): Data/hora inicial no formato ISO 8601
  - `end` (obrigatório): Data/hora final no formato ISO 8601
  - `interval` (opcional): Intervalo em segundos para amostragem (padrão: 60)
- **Resposta de Sucesso** (200 OK):
  ```json
  {
    "vehicleId": "123e4567-e89b-12d3-a456-426614174000",
    "positions": [
      {
        "latitude": -23.5505,
        "longitude": -46.6333,
        "timestamp": "2025-02-15T14:00:00Z",
        "speed": 60,
        "ignition": true,
        "heading": 90,
        "altitude": 800
      },
      {
        "latitude": -23.5508,
        "longitude": -46.6339,
        "timestamp": "2025-02-15T14:01:00Z",
        "speed": 65,
        "ignition": true,
        "heading": 92,
        "altitude": 805
      },
      // ... mais posições
    ]
  }
  ```

## 5.8 Relatórios

### 5.8.1 Gerar Relatório

Gera um relatório customizado.

- **URL**: `/api/reports`
- **Método**: `POST`
- **Autenticação Requerida**: Sim
- **Corpo da Requisição**:
  ```json
  {
    "type": "travel",
    "vehicles": ["123e4567-e89b-12d3-a456-426614174000"],
    "startDate": "2025-02-15T00:00:00Z",
    "endDate": "2025-02-15T23:59:59Z",
    "format": "pdf"
  }
  ```
- **Resposta de Sucesso** (200 OK):
  ```json
  {
    "reportId": "123e4567-e89b-12d3-a456-426614174000",
    "downloadUrl": "/api/reports/123e4567-e89b-12d3-a456-426614174000/download",
    "generatedAt": "2025-02-16T10:30:00Z",
    "expiresAt": "2025-02-23T10:30:00Z"
  }
  ``` 