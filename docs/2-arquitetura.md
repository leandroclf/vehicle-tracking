# 2. Arquitetura do Sistema

## 2.1 Visão Geral da Arquitetura

O Yukz utiliza uma arquitetura moderna e modular, baseada em microserviços, com frontend e backend parcialmente desacoplados. O sistema é composto por duas partes principais:

1. **Aplicação Web (Next.js)**: Interface do usuário e API backend para interação com o banco de dados
2. **Servidor de Rastreamento (Tracker Server)**: Componente especializado para comunicação com dispositivos rastreadores

### Diagrama de Arquitetura Simplificado

```
+----------------------------------+       +---------------------+
|             YUKZ APP             |       |                     |
|  +-------------+  +-----------+  |       |   TRACKER SERVER    |
|  |   Frontend  |  |  Backend  |  |       |                     |
|  |   (Next.js) |  |   (API)   |<-------------> TCP/UDP        |
|  +-------------+  +-----------+  |       |    Interface        |
|           ^             ^        |       |                     |
+-----------|-------------|--------+       +----------^----------+
            |             |                           |
            v             v                           |
     +-------------------------------------+          |
     |              SUPABASE               |<---------+
     |                                     |
     | +-------------+ +---------------+   |
     | | Auth/Storage| |    Database   |   |
     | +-------------+ +---------------+   |
     +-------------------------------------+
                        ^
                        |
                        v
     +-------------------------------------+
     |          DISPOSITIVOS GPS           |
     |      (Teltonika, Queclink, etc)     |
     +-------------------------------------+
```

## 2.2 Componentes Principais

### 2.2.1 Aplicação Web (Next.js)

A aplicação web é construída com Next.js 15.1.4 e React 18.2.0, utilizando uma abordagem moderna com:

- **App Router**: Roteamento baseado em sistema de arquivos
- **Server Components**: Renderização híbrida para melhor performance 
- **API Routes**: Endpoints de API integrados com a aplicação
- **Context API**: Gerenciamento de estado global

Principais responsabilidades:
- Renderização da interface do usuário
- Autenticação e autorização de usuários
- Comunicação com o banco de dados Supabase
- Processamento e apresentação de dados de rastreamento

### 2.2.2 Servidor de Rastreamento (Tracker Server)

Um servidor Node.js dedicado para comunicação com dispositivos rastreadores físicos, responsável por:

- Receber e decodificar protocolos de rastreadores (ex: Teltonika Codec8)
- Processar dados de localização e telemetria
- Armazenar informações no banco de dados
- Gerar alertas baseados em regras (geocercas, velocidade, etc.)

### 2.2.3 Banco de Dados (Supabase/PostgreSQL)

O sistema utiliza Supabase como plataforma de backend, provendo:

- Banco de dados PostgreSQL para armazenamento persistente
- Sistema de autenticação e gerenciamento de usuários
- Storage para arquivos e imagens
- Realtime para atualizações em tempo real

## 2.3 Fluxos de Dados Principais

### 2.3.1 Fluxo de Autenticação

1. Usuário insere credenciais no frontend
2. Dados são enviados para API de autenticação
3. Backend valida credenciais contra Supabase Auth
4. Token JWT é gerado e retornado ao cliente
5. Frontend armazena token e utiliza para requisições subsequentes

### 2.3.2 Fluxo de Rastreamento

1. Dispositivo GPS envia dados para o Tracker Server via TCP/UDP
2. Tracker Server decodifica o protocolo específico
3. Dados processados são armazenados no banco de dados Supabase
4. Aplicação web consulta dados atualizados via API
5. Interface exibe localização e informações do veículo no mapa

### 2.3.3 Fluxo de Alertas

1. Tracker Server ou regras no backend detectam condições de alerta
2. Alerta é gerado e armazenado no banco de dados
3. Aplicação web consulta alertas periodicamente ou recebe via Supabase Realtime
4. Interface exibe notificações para o usuário

## 2.4 Infraestrutura e Deploy

O sistema foi projetado para ser implantado como contêineres Docker, facilitando:

- Deploy em qualquer ambiente compatível com Docker
- Escalabilidade horizontal
- Consistência entre ambientes de desenvolvimento e produção

O deploy pode ser realizado utilizando scripts fornecidos:
- `deploy-docker.sh` (Linux/Mac)
- `deploy-docker.ps1` (Windows) 