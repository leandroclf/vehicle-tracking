# Guia de Configuração Docker

Este guia explica como configurar e executar o sistema de rastreamento veicular usando Docker, incluindo banco de dados PostgreSQL com dados iniciais, Redis, aplicação Next.js e servidor de rastreamento de dispositivos.

## 📋 Pré-requisitos

### Software Necessário
- **Docker Desktop** (Windows/Mac) ou **Docker Engine** (Linux)
- **Docker Compose** (geralmente incluído no Docker Desktop)
- **Git** (para clonar o repositório)

### Verificação de Instalação
```bash
# Verificar Docker
docker --version
docker-compose --version

# Verificar se o Docker está rodando
docker ps
```

## 🚀 Configuração Rápida

### Windows (PowerShell)
```powershell
# Executar script de configuração
.\scripts\docker-setup.ps1

# Com limpeza de volumes existentes
.\scripts\docker-setup.ps1 -Clean

# Reiniciar serviços
.\scripts\docker-setup.ps1 -Restart

# Ver logs
.\scripts\docker-setup.ps1 -Logs
```

### Linux/Mac (Bash)
```bash
# Dar permissão de execução
chmod +x scripts/docker-setup.sh

# Executar script de configuração
./scripts/docker-setup.sh

# Com limpeza de volumes existentes
./scripts/docker-setup.sh --clean

# Reiniciar serviços
./scripts/docker-setup.sh --restart

# Ver logs
./scripts/docker-setup.sh --logs
```

## 🔧 Configuração Manual

### 1. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Configurações do banco de dados
DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/vehicle_tracking
REDIS_URL=redis://localhost:6379

# Configurações do Supabase
SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Google Maps API Key
GOOGLE_MAPS_API_KEY=your-google-maps-api-key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# Configurações de ambiente
NODE_ENV=development
PORT=3000
```

### 2. Construir e Iniciar Serviços

```bash
# Construir imagens
docker-compose -f docker-compose.full.yml build

# Iniciar todos os serviços
docker-compose -f docker-compose.full.yml up -d

# Ver logs
docker-compose -f docker-compose.full.yml logs -f

# Parar serviços
docker-compose -f docker-compose.full.yml down
```

## 🏗️ Arquitetura dos Serviços

### Serviços Incluídos

| Serviço | Porta | Descrição |
|---------|-------|----------|
| **postgres** | 5432 | Banco de dados PostgreSQL com dados iniciais |
| **redis** | 6379 | Cache e sessões |
| **app** | 3000 | Aplicação Next.js principal |
| **tracker-server** | 5027-5030 | Servidor de rastreamento de dispositivos |
| **adminer** | 8080 | Interface de administração do banco |
| **supabase** | 54321 | Supabase local (perfil development) |

### Portas do Servidor de Rastreamento
- **5027**: Teltonika TCP
- **5028**: UDP genérico
- **5029**: Queclink TCP
- **5030**: Concox TCP

## 📊 Dados Iniciais

### Usuários de Teste
| Email | Senha | Tipo |
|-------|-------|------|
| admin@yukz.com | admin123 | Administrador |
| teste@yukz.com | teste123 | Usuário comum |

### Dados Incluídos
- **4 veículos** de exemplo (carros, moto, caminhão)
- **Status em tempo real** simulado
- **Eventos** das últimas 24 horas
- **Viagens** de exemplo
- **Cercas virtuais** configuradas
- **Alertas** e **notificações** de teste
- **Configurações** padrão dos usuários

## 🔍 Monitoramento e Logs

### Verificar Status dos Serviços
```bash
# Status geral
docker-compose -f docker-compose.full.yml ps

# Logs de um serviço específico
docker-compose -f docker-compose.full.yml logs postgres
docker-compose -f docker-compose.full.yml logs app
docker-compose -f docker-compose.full.yml logs tracker-server

# Logs em tempo real
docker-compose -f docker-compose.full.yml logs -f
```

### Health Checks
Todos os serviços incluem health checks automáticos:

```bash
# Verificar saúde dos containers
docker ps --format "table {{.Names}}\t{{.Status}}"
```

## 🗄️ Administração do Banco de Dados

### Acesso via Adminer
1. Abra http://localhost:8080
2. Configure a conexão:
   - **Sistema**: PostgreSQL
   - **Servidor**: postgres
   - **Usuário**: postgres
   - **Senha**: postgres123
   - **Base de dados**: vehicle_tracking

### Acesso Direto via CLI
```bash
# Conectar ao PostgreSQL
docker-compose -f docker-compose.full.yml exec postgres psql -U postgres -d vehicle_tracking

# Executar comandos SQL
\dt  # Listar tabelas
SELECT * FROM vehicles;  # Ver veículos
SELECT * FROM profiles;  # Ver perfis
```

## 🔧 Comandos Úteis

### Gerenciamento de Containers
```bash
# Parar todos os serviços
docker-compose -f docker-compose.full.yml down

# Parar e remover volumes
docker-compose -f docker-compose.full.yml down -v

# Reconstruir imagens
docker-compose -f docker-compose.full.yml build --no-cache

# Reiniciar um serviço específico
docker-compose -f docker-compose.full.yml restart app
```

### Limpeza do Sistema
```bash
# Remover containers parados
docker container prune

# Remover imagens não utilizadas
docker image prune

# Remover volumes não utilizados
docker volume prune

# Limpeza completa (cuidado!)
docker system prune -a
```

## 🐛 Solução de Problemas

### Problemas Comuns

#### 1. Porta já em uso
```bash
# Verificar o que está usando a porta
netstat -tulpn | grep :3000

# Parar processo específico
kill -9 <PID>
```

#### 2. Banco de dados não inicia
```bash
# Verificar logs do PostgreSQL
docker-compose -f docker-compose.full.yml logs postgres

# Remover volume e recriar
docker-compose -f docker-compose.full.yml down -v
docker volume rm yukz_postgres_data
```

#### 3. Aplicação não conecta ao banco
```bash
# Verificar variáveis de ambiente
docker-compose -f docker-compose.full.yml exec app env | grep DATABASE

# Testar conectividade
docker-compose -f docker-compose.full.yml exec app ping postgres
```

#### 4. Permissões no Windows
```powershell
# Executar PowerShell como Administrador
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Logs de Debug
```bash
# Logs detalhados de um serviço
docker-compose -f docker-compose.full.yml logs --details postgres

# Seguir logs em tempo real
docker-compose -f docker-compose.full.yml logs -f --tail=100
```

## 🚀 Perfis de Execução

### Desenvolvimento Completo
```bash
# Inclui Supabase local e Adminer
docker-compose -f docker-compose.full.yml --profile development up -d
```

### Produção
```bash
# Apenas serviços essenciais
docker-compose -f docker-compose.full.yml up -d postgres redis app tracker-server
```

## 📈 Performance e Otimização

### Configurações de Performance
O PostgreSQL está configurado com:
- **shared_buffers**: 256MB
- **effective_cache_size**: 1GB
- **max_connections**: 200
- **maintenance_work_mem**: 64MB

### Monitoramento de Recursos
```bash
# Uso de recursos dos containers
docker stats

# Espaço usado pelos volumes
docker system df
```

## 🔒 Segurança

### Configurações de Segurança
- Senhas padrão apenas para desenvolvimento
- RLS (Row Level Security) habilitado no PostgreSQL
- Políticas de acesso configuradas
- Variáveis de ambiente para secrets

### Para Produção
1. Altere todas as senhas padrão
2. Configure certificados SSL
3. Use secrets do Docker
4. Configure firewall adequadamente
5. Monitore logs de segurança

## 📚 Próximos Passos

1. **Configurar APIs externas**: Supabase e Google Maps
2. **Personalizar dados**: Adicionar seus próprios veículos e usuários
3. **Configurar monitoramento**: Implementar alertas e métricas
4. **Deploy em produção**: Configurar ambiente de produção
5. **Backup**: Implementar estratégia de backup dos dados

## 🆘 Suporte

Se encontrar problemas:
1. Verifique os logs dos serviços
2. Consulte a seção de solução de problemas
3. Verifique as configurações de rede do Docker
4. Reinicie o Docker Desktop se necessário

---

**Nota**: Este ambiente é configurado para desenvolvimento. Para produção, ajuste as configurações de segurança, performance e monitoramento conforme necessário.