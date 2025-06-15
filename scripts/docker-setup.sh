#!/bin/bash

# Script de configuração Docker para o sistema de rastreamento veicular
# Este script configura todo o ambiente de desenvolvimento/produção

set -e  # Parar execução em caso de erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para logging
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar se Docker está instalado
check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker não está instalado. Por favor, instale o Docker primeiro."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose não está instalado. Por favor, instale o Docker Compose primeiro."
        exit 1
    fi
    
    log_success "Docker e Docker Compose encontrados"
}

# Criar arquivo .env se não existir
setup_env() {
    if [ ! -f ".env" ]; then
        log_info "Criando arquivo .env..."
        cat > .env << EOF
# Configurações do banco de dados
DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/vehicle_tracking
REDIS_URL=redis://localhost:6379

# Configurações do Supabase (substitua pelos seus valores)
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
EOF
        log_success "Arquivo .env criado. Por favor, configure as variáveis necessárias."
        log_warning "IMPORTANTE: Configure as chaves do Supabase e Google Maps no arquivo .env"
    else
        log_info "Arquivo .env já existe"
    fi
}

# Verificar se os arquivos necessários existem
check_files() {
    local files=(
        "docker-compose.full.yml"
        "migrations/unified_schema.sql"
        "migrations/create_rpc_functions.sql"
        "scripts/init-data.sql"
        "Dockerfile"
        "tracker-server/Dockerfile"
    )
    
    for file in "${files[@]}"; do
        if [ ! -f "$file" ]; then
            log_error "Arquivo necessário não encontrado: $file"
            exit 1
        fi
    done
    
    log_success "Todos os arquivos necessários encontrados"
}

# Parar containers existentes
stop_containers() {
    log_info "Parando containers existentes..."
    docker-compose -f docker-compose.full.yml down --remove-orphans || true
    log_success "Containers parados"
}

# Limpar volumes (opcional)
clean_volumes() {
    if [ "$1" = "--clean" ]; then
        log_warning "Removendo volumes existentes..."
        docker volume rm yukz_postgres_data yukz_redis_data 2>/dev/null || true
        log_success "Volumes removidos"
    fi
}

# Construir imagens
build_images() {
    log_info "Construindo imagens Docker..."
    docker-compose -f docker-compose.full.yml build --no-cache
    log_success "Imagens construídas com sucesso"
}

# Iniciar serviços
start_services() {
    log_info "Iniciando serviços..."
    
    # Iniciar apenas o banco de dados primeiro
    log_info "Iniciando PostgreSQL..."
    docker-compose -f docker-compose.full.yml up -d postgres
    
    # Aguardar o banco estar pronto
    log_info "Aguardando PostgreSQL ficar pronto..."
    timeout 60 bash -c 'until docker-compose -f docker-compose.full.yml exec postgres pg_isready -U postgres -d vehicle_tracking; do sleep 2; done'
    
    # Iniciar Redis
    log_info "Iniciando Redis..."
    docker-compose -f docker-compose.full.yml up -d redis
    
    # Aguardar Redis estar pronto
    log_info "Aguardando Redis ficar pronto..."
    timeout 30 bash -c 'until docker-compose -f docker-compose.full.yml exec redis redis-cli ping; do sleep 2; done'
    
    # Iniciar aplicação
    log_info "Iniciando aplicação..."
    docker-compose -f docker-compose.full.yml up -d app
    
    # Iniciar servidor de rastreamento
    log_info "Iniciando servidor de rastreamento..."
    docker-compose -f docker-compose.full.yml up -d tracker-server
    
    log_success "Todos os serviços iniciados"
}

# Verificar status dos serviços
check_services() {
    log_info "Verificando status dos serviços..."
    
    sleep 10  # Aguardar um pouco para os serviços iniciarem
    
    # Verificar PostgreSQL
    if docker-compose -f docker-compose.full.yml exec postgres pg_isready -U postgres -d vehicle_tracking &>/dev/null; then
        log_success "PostgreSQL: ✓ Online"
    else
        log_error "PostgreSQL: ✗ Offline"
    fi
    
    # Verificar Redis
    if docker-compose -f docker-compose.full.yml exec redis redis-cli ping &>/dev/null; then
        log_success "Redis: ✓ Online"
    else
        log_error "Redis: ✗ Offline"
    fi
    
    # Verificar aplicação
    if curl -f http://localhost:3000 &>/dev/null; then
        log_success "Aplicação: ✓ Online (http://localhost:3000)"
    else
        log_warning "Aplicação: ⚠ Iniciando... (aguarde alguns minutos)"
    fi
    
    # Verificar servidor de rastreamento
    if nc -z localhost 5027 &>/dev/null; then
        log_success "Servidor de Rastreamento: ✓ Online (porta 5027)"
    else
        log_warning "Servidor de Rastreamento: ⚠ Iniciando..."
    fi
}

# Mostrar logs
show_logs() {
    if [ "$1" = "--logs" ]; then
        log_info "Mostrando logs dos serviços..."
        docker-compose -f docker-compose.full.yml logs -f
    fi
}

# Mostrar informações de acesso
show_access_info() {
    echo ""
    log_success "=== SISTEMA CONFIGURADO COM SUCESSO ==="
    echo ""
    echo "🌐 Aplicação Principal: http://localhost:3000"
    echo "🗄️  Adminer (DB Admin): http://localhost:8080"
    echo "📊 PostgreSQL: localhost:5432"
    echo "🔄 Redis: localhost:6379"
    echo "📡 Servidor Rastreamento:"
    echo "   - Teltonika TCP: localhost:5027"
    echo "   - UDP: localhost:5028"
    echo "   - Queclink TCP: localhost:5029"
    echo "   - Concox TCP: localhost:5030"
    echo ""
    echo "👤 Usuários de teste:"
    echo "   - admin@yukz.com / admin123"
    echo "   - teste@yukz.com / teste123"
    echo ""
    echo "📋 Comandos úteis:"
    echo "   - Ver logs: docker-compose -f docker-compose.full.yml logs -f"
    echo "   - Parar: docker-compose -f docker-compose.full.yml down"
    echo "   - Reiniciar: ./scripts/docker-setup.sh --restart"
    echo ""
}

# Função principal
main() {
    echo "🚀 Configurando ambiente Docker para Sistema de Rastreamento Veicular"
    echo ""
    
    # Verificar argumentos
    case "$1" in
        --clean)
            log_info "Modo limpeza ativado"
            ;;
        --restart)
            log_info "Reiniciando serviços..."
            stop_containers
            start_services
            check_services
            show_access_info
            exit 0
            ;;
        --logs)
            show_logs --logs
            exit 0
            ;;
        --help)
            echo "Uso: $0 [opções]"
            echo "Opções:"
            echo "  --clean    Remove volumes existentes antes de iniciar"
            echo "  --restart  Reinicia os serviços"
            echo "  --logs     Mostra logs dos serviços"
            echo "  --help     Mostra esta ajuda"
            exit 0
            ;;
    esac
    
    # Executar verificações e configuração
    check_docker
    check_files
    setup_env
    stop_containers
    clean_volumes "$1"
    build_images
    start_services
    check_services
    show_access_info
    
    # Mostrar logs se solicitado
    if [ "$2" = "--logs" ]; then
        show_logs --logs
    fi
}

# Executar função principal com todos os argumentos
main "$@"