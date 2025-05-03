# 6. Instalação e Execução

Este guia fornece instruções detalhadas para instalação, configuração e execução do sistema Yukz em diferentes ambientes.

## 6.1 Requisitos do Sistema

### 6.1.1 Requisitos Mínimos

- **Node.js**: versão 18.0.0 ou superior
- **Banco de Dados**: Conta no Supabase (inclui PostgreSQL)
- **Armazenamento**: 250MB para código-fonte e dependências
- **Memória**: 1GB de RAM para desenvolvimento
- **API do Google Maps**: Conta Google com APIs habilitadas e chave configurada
- **Docker** (opcional): Para implantação containerizada

### 6.1.2 Requisitos Recomendados

- **Node.js**: versão 20.0.0 ou superior
- **Memória**: 2GB de RAM ou mais
- **Conexão Internet**: Estável para comunicação com Supabase e Google Maps
- **Sistema Operacional**: macOS, Windows 10/11 ou Linux (Ubuntu 20.04+)

## 6.2 Instalação do Ambiente de Desenvolvimento

### 6.2.1 Preparação do Ambiente

1. **Instalar Node.js**:
   - Acesse [nodejs.org](https://nodejs.org/)
   - Baixe e instale a versão LTS (Long Term Support) mais recente
   - Verifique a instalação executando:
     ```bash
     node --version
     npm --version
     ```

2. **Configurar Conta no Supabase**:
   - Crie uma conta em [supabase.com](https://supabase.com/)
   - Crie um novo projeto
   - Obtenha a URL e chave anônima do projeto (serão usadas na configuração)

3. **Configurar Google Maps API**:
   - Acesse o [Google Cloud Console](https://console.cloud.google.com/)
   - Crie um projeto (ou selecione um existente)
   - Habilite a API Maps JavaScript
   - Crie uma chave de API com restrições apropriadas

### 6.2.2 Clonando o Repositório

```bash
git clone https://github.com/yukz/vehicle-tracking.git
cd vehicle-tracking
```

### 6.2.3 Instalação de Dependências

1. **Aplicação Principal**:
   ```bash
   # Na pasta raiz do projeto
   npm install
   ```

2. **Servidor de Rastreamento**:
   ```bash
   # Na pasta do servidor de rastreamento
   cd tracker-server
   npm install
   cd ..
   ```

## 6.3 Configuração do Ambiente

### 6.3.1 Variáveis de Ambiente

1. **Criar arquivo `.env.local` na raiz do projeto**:
   ```
   # Conexão com Supabase
   SUPABASE_URL=https://<seu-projeto>.supabase.co
   SUPABASE_ANON_KEY=<sua-chave-anônima>
   SUPABASE_SERVICE_ROLE_KEY=<sua-chave-service-role>

   # Google Maps
   GOOGLE_MAPS_API_KEY=<sua-chave-google-maps>

   # JWT (para autenticação personalizada)
   JWT_SECRET=<chave-secreta-para-jwt>

   # Configurações da Aplicação
   APP_NAME=Yukz Vehicle Tracking
   NODE_ENV=development
   ```

2. **Criar arquivo `.env` na pasta `tracker-server`**:
   ```
   # Conexão com Supabase
   SUPABASE_URL=https://<seu-projeto>.supabase.co
   SUPABASE_ANON_KEY=<sua-chave-anônima>
   SUPABASE_SERVICE_ROLE_KEY=<sua-chave-service-role>

   # Configuração do Servidor
   TRACKER_TCP_PORT=5027
   TRACKER_UDP_PORT=5028

   # Configurações de Log
   LOG_LEVEL=debug
   ```

### 6.3.2 Configuração do Banco de Dados

1. **Aplicar Migrações**:
   - Acesse o painel do Supabase para seu projeto
   - Vá para a seção "SQL Editor"
   - Execute o script de migração localizado em `migrations/0001_initial_schema.sql`

2. **Verificar Tabelas**:
   - Após executar a migração, verifique se as tabelas foram criadas corretamente
   - As principais tabelas incluem: `users`, `vehicles`, `tracker_devices`, `vehicle_positions`, `geofences`, `alerts`, `settings`

## 6.4 Execução do Sistema

### 6.4.1 Modo de Desenvolvimento

1. **Iniciar a Aplicação Web**:
   ```bash
   # Na pasta raiz do projeto
   npm run dev
   ```
   A aplicação estará disponível em `http://localhost:3000`

2. **Iniciar o Servidor de Rastreamento**:
   ```bash
   # Em outro terminal, na pasta tracker-server
   cd tracker-server
   node server.js
   ```
   O servidor estará ouvindo conexões TCP na porta 5027 (ou conforme configurado)

### 6.4.2 Construção para Produção

1. **Construir a Aplicação Web**:
   ```bash
   # Na pasta raiz do projeto
   npm run build
   ```

2. **Executar Versão de Produção**:
   ```bash
   npm start
   ```
   A aplicação estará disponível em `http://localhost:3000` (ou conforme configurado)

## 6.5 Implantação com Docker

### 6.5.1 Construir Imagem Docker

```bash
# Na pasta raiz do projeto
docker build -t yukz-vehicle-tracking .
```

### 6.5.2 Executar Container

```bash
docker run -p 3000:3000 \
  -e SUPABASE_URL=<sua-url> \
  -e SUPABASE_ANON_KEY=<sua-chave> \
  -e GOOGLE_MAPS_API_KEY=<sua-chave> \
  -e JWT_SECRET=<sua-chave-secreta> \
  yukz-vehicle-tracking
```

### 6.5.3 Implantação Automatizada

O projeto inclui scripts para implantação automatizada:

- **Windows**: Execute `deploy-docker.ps1`
  ```
  .\deploy-docker.ps1
  ```

- **Linux/Mac**: Execute `deploy-docker.sh`
  ```
  ./deploy-docker.sh
  ```

## 6.6 Acessando a Aplicação

1. **Acesse o sistema** em um navegador:
   - Desenvolvimento local: `http://localhost:3000`
   - Produção: Conforme URL de implantação

2. **Conta de demonstração**:
   - Email: `demo@yukz.com`
   - Senha: `demo123`
   - Nota: Para primeira execução, pode ser necessário registrar este usuário através da interface.

## 6.7 Testes

### 6.7.1 Executando Testes Automatizados

```bash
# Na pasta raiz do projeto
npm run test          # Executa todos os testes
npm run test:watch    # Executa em modo watch
npm run test:coverage # Executa e gera relatório de cobertura
```

## 6.8 Solução de Problemas

### 6.8.1 Problemas Comuns

1. **Erro de Conexão com Supabase**:
   - Verifique se as credenciais do Supabase estão corretas no `.env.local`
   - Confirme que o projeto no Supabase está ativo
   - Verifique se o IP do seu ambiente está na lista de permissões do Supabase

2. **Mapa Não Carrega**:
   - Verifique se a chave da API Google Maps está correta
   - Confirme que a API Maps JavaScript está habilitada no Google Cloud Console
   - Verifique restrições de domínio/IP na chave da API

3. **Erro de Permissão no Docker**:
   - Em sistemas Linux/Mac, pode ser necessário dar permissão de execução ao script:
     ```bash
     chmod +x deploy-docker.sh
     ```

4. **Conflitos de Dependências**:
   - Em caso de conflitos, tente instalar com flag de legado:
     ```bash
     npm install --legacy-peer-deps
     ```

### 6.8.2 Logs e Diagnóstico

- **Logs da Aplicação Web**: Disponíveis no console do navegador e terminal onde o servidor está rodando
- **Logs do Servidor de Rastreamento**: Disponíveis no terminal onde o servidor está rodando e nos arquivos de log (se configurados)
- **Logs do Docker**: Acesse com `docker logs <container_id>` 