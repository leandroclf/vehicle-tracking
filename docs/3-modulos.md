# 3. Módulos e Responsabilidades

O sistema Yukz está organizado em módulos lógicos que encapsulam funcionalidades específicas. Esta seção detalha cada módulo e suas responsabilidades.

## 3.1 Módulo de Autenticação

**Localização**: `src/app/api/auth/`, `src/app/login/`, `src/app/register/`, `src/components/auth/`, `src/lib/auth.tsx`

**Responsabilidades**:
- Registro de novos usuários
- Autenticação de usuários existentes
- Gerenciamento de sessões via JWT
- Proteção de rotas privadas
- Gerenciamento de permissões

**Principais Componentes**:
- `LoginForm`: Formulário de login com validação
- `RegisterForm`: Formulário de cadastro com validação
- `AuthProvider`: Contexto global para estado de autenticação
- Middleware de autenticação para API routes

**Fluxo de Dados**:
- Usuário submete credenciais
- Backend valida contra banco de dados
- Token JWT é gerado e armazenado
- Context API mantém estado de autenticação na aplicação

## 3.2 Módulo de Veículos

**Localização**: `src/app/api/vehicles/`, `src/app/dashboard/vehicles/`, `src/components/vehicle/`, `src/lib/vehicles.tsx`

**Responsabilidades**:
- CRUD completo de veículos
- Vinculação de veículos a usuários
- Associação de dispositivos rastreadores
- Visualização de detalhes e status
- Histórico de posições e eventos

**Principais Componentes**:
- `VehicleList`: Lista de veículos com filtragem
- `VehicleCard`: Card com informações resumidas
- `VehicleForm`: Formulário para adição/edição
- `VehicleDetails`: Visualização detalhada com telemetria
- `VehiclesProvider`: Contexto para gerenciamento de estado

## 3.3 Módulo de Mapa

**Localização**: `src/app/dashboard/map/`, `src/components/map/`

**Responsabilidades**:
- Visualização de veículos no mapa
- Rastreamento em tempo real
- Exibição de histórico de rotas
- Visualização e edição de geocercas
- Interação com elementos do mapa

**Principais Componentes**:
- `MapContainer`: Componente principal do mapa
- `VehicleMarker`: Marcador de veículo com informações
- `RoutePolyline`: Linha de trajetória do veículo
- `GeofenceCircle`: Representação visual de geocerca circular
- `GeofencePolygon`: Representação visual de geocerca poligonal

**Integração**:
- Google Maps API via `@react-google-maps/api`
- Atualização em tempo real via polling ou Supabase Realtime

## 3.4 Módulo de Geocercas

**Localização**: `src/app/api/geofences/`, `src/app/dashboard/geofences/`, `src/components/map/geofences/`

**Responsabilidades**:
- Criação e gerenciamento de áreas de monitoramento
- Configuração de alertas de entrada/saída
- Visualização de geocercas no mapa
- Edição visual (desenho) de geocercas
- Associação de veículos a geocercas

**Principais Componentes**:
- `GeofenceList`: Lista de geocercas configuradas
- `GeofenceForm`: Formulário para criação/edição
- `GeofenceDrawTools`: Ferramentas para desenho no mapa
- API endpoints para CRUD de geocercas

## 3.5 Módulo de Alertas

**Localização**: `src/app/api/alerts/`, `src/app/dashboard/alerts/`, `src/lib/alerts.tsx`

**Responsabilidades**:
- Geração de alertas baseados em regras
- Notificação em tempo real
- Histórico de alertas
- Configuração de tipos de alertas
- Gerenciamento de status (lido/não lido)

**Principais Componentes**:
- `AlertsList`: Lista de alertas com filtragem
- `AlertsPanel`: Painel de notificações em tempo real
- `AlertSettingsForm`: Configuração de preferências
- API endpoints para gerenciamento de alertas

## 3.6 Módulo de Relatórios

**Localização**: `src/app/dashboard/reports/`, `src/lib/reports.tsx`

**Responsabilidades**:
- Geração de relatórios customizados
- Análise de dados históricos
- Visualização de métricas e estatísticas
- Exportação em diferentes formatos
- Agendamento de relatórios periódicos

**Principais Componentes**:
- `ReportGenerator`: Interface para criação de relatórios
- `ReportViewer`: Visualização de relatórios gerados
- `ChartComponents`: Gráficos e visualizações de dados
- `ExportTools`: Funcionalidades de exportação

## 3.7 Módulo de Configurações

**Localização**: `src/app/api/settings/`, `src/app/dashboard/settings/`, `src/lib/settings.tsx`

**Responsabilidades**:
- Preferências do usuário
- Configurações da conta
- Personalizações de interface
- Configurações de notificações
- Parâmetros do sistema

**Principais Componentes**:
- `SettingsForm`: Formulário de configurações
- `ProfileSettings`: Gerenciamento de perfil
- `NotificationSettings`: Preferências de alertas
- `UISettings`: Personalização de interface
- `SettingsProvider`: Contexto para estado de configurações

## 3.8 Módulo de UI

**Localização**: `src/components/ui/`, `src/styles/`

**Responsabilidades**:
- Componentes visuais reutilizáveis
- Design system consistente
- Temas (claro/escuro)
- Responsividade
- Acessibilidade

**Principais Componentes**:
- Componentes base (Button, Input, Card, etc.)
- Componentes de layout (Container, Grid, Flex)
- Componentes de feedback (Toast, Alert, Modal)
- Componentes de navegação (Tabs, Sidebar, Navbar)
- Utilitários de tema e estilo

## 3.9 Tracker Server

**Localização**: `tracker-server/`

**Responsabilidades**:
- Comunicação TCP/UDP com dispositivos
- Decodificação de protocolos proprietários
- Processamento de dados de telemetria
- Persistência no banco de dados
- Geração de eventos e alertas

**Principais Componentes**:
- Servidores TCP/UDP
- Decodificadores de protocolos
- Processadores de mensagens
- Integrações com banco de dados
- Sistema de regras e alertas 