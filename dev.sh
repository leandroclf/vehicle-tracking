#!/bin/bash

# Script de desenvolvimento rápido para Vehicle Tracking
# Uso: ./dev.sh [comando]

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log colorido
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

# Função para verificar se Docker está rodando
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        error "Docker não está rodando. Por favor, inicie o Docker Desktop."
    fi
}

# Função para verificar se as dependências estão instaladas
check_dependencies() {
    if [ ! -d "node_modules" ]; then
        log "Instalando dependências da aplicação..."
        npm install
    fi
    
    if [ ! -d "tracker-server/node_modules" ]; then
        log "Instalando dependências do tracker server..."
        cd tracker-server && npm install && cd ..
    fi
}

# Função para limpar cache e containers antigos
cleanup() {
    log "Limpando containers e cache antigos..."
    docker-compose -f docker-compose.dev.yml down --remove-orphans 2>/dev/null || true
    docker-compose -f docker-compose.yml down --remove-orphans 2>/dev/null || true
    docker system prune -f
}

# Função para desenvolvimento com hot reload
dev() {
    log "Iniciando ambiente de desenvolvimento com hot reload..."
    check_docker
    check_dependencies
    
    # Para containers existentes
    docker-compose -f docker-compose.dev.yml down 2>/dev/null || true
    
    # Inicia em modo desenvolvimento
    docker-compose -f docker-compose.dev.yml up --build
}

# Função para desenvolvimento em background
dev_bg() {
    log "Iniciando ambiente de desenvolvimento em background..."
    check_docker
    check_dependencies
    
    # Para containers existentes
    docker-compose -f docker-compose.dev.yml down 2>/dev/null || true
    
    # Inicia em modo desenvolvimento em background
    docker-compose -f docker-compose.dev.yml up --build -d
    
    log "Ambiente iniciado! Acesse:"
    log "  - Aplicação: http://localhost:3000"
    log "  - Tracker Server: localhost:8080-8083"
    log ""
    log "Para ver logs: docker-compose -f docker-compose.dev.yml logs -f"
    log "Para parar: docker-compose -f docker-compose.dev.yml down"
}

# Função para produção
prod() {
    log "Iniciando ambiente de produção..."
    check_docker
    
    # Para containers existentes
    docker-compose down 2>/dev/null || true
    
    # Constrói e inicia produção
    docker-compose up --build -d
    
    log "Ambiente de produção iniciado!"
    log "  - Aplicação: http://localhost:3000"
    log "  - Tracker Server: localhost:8080-8083"
}

# Função para build rápido
build() {
    log "Construindo imagens..."
    check_docker
    
    # Build paralelo com cache
    docker-compose build --parallel
    
    log "Build concluído!"
}

# Função para logs
logs() {
    local service=${1:-""}
    
    if [ -n "$service" ]; then
        log "Mostrando logs do serviço: $service"
        docker-compose -f docker-compose.dev.yml logs -f "$service"
    else
        log "Mostrando logs de todos os serviços..."
        docker-compose -f docker-compose.dev.yml logs -f
    fi
}

# Função para status
status() {
    log "Status dos containers:"
    docker ps -a --filter "name=yukz" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
}

# Função para restart rápido
restart() {
    log "Reiniciando ambiente de desenvolvimento..."
    docker-compose -f docker-compose.dev.yml restart
    log "Ambiente reiniciado!"
}

# Função para shell
shell() {
    local service=${1:-"app"}
    log "Acessando shell do serviço: $service"
    
    if [ "$service" = "app" ]; then
        docker exec -it yukz-app-dev sh
    elif [ "$service" = "tracker" ]; then
        docker exec -it yukz-tracker-server-dev sh
    else
        error "Serviço inválido. Use 'app' ou 'tracker'"
    fi
}

# Função para teste local
test_local() {
    log "Executando testes locais..."
    npm test
    
    log "Testando build local..."
    npm run build
    
    log "Testes concluídos!"
}

# Função para ajuda
help() {
    echo -e "${BLUE}Vehicle Tracking - Script de Desenvolvimento${NC}"
    echo ""
    echo "Uso: $0 [comando]"
    echo ""
    echo "Comandos disponíveis:"
    echo "  dev         - Inicia desenvolvimento com hot reload"
    echo "  dev-bg      - Inicia desenvolvimento em background"
    echo "  prod        - Inicia ambiente de produção"
    echo "  build       - Constrói imagens Docker"
    echo "  logs [srv]  - Mostra logs (opcional: app, tracker)"
    echo "  status      - Mostra status dos containers"
    echo "  restart     - Reinicia ambiente de desenvolvimento"
    echo "  shell [srv] - Acessa shell (app ou tracker)"
    echo "  test        - Executa testes locais"
    echo "  cleanup     - Limpa containers e cache"
    echo "  help        - Mostra esta ajuda"
    echo ""
    echo "Exemplos:"
    echo "  $0 dev              # Desenvolvimento com logs"
    echo "  $0 dev-bg           # Desenvolvimento em background"
    echo "  $0 logs app         # Logs apenas da aplicação"
    echo "  $0 shell tracker    # Shell do tracker server"
}

# Main
case "${1:-help}" in
    "dev")
        dev
        ;;
    "dev-bg")
        dev_bg
        ;;
    "prod")
        prod
        ;;
    "build")
        build
        ;;
    "logs")
        logs "$2"
        ;;
    "status")
        status
        ;;
    "restart")
        restart
        ;;
    "shell")
        shell "$2"
        ;;
    "test")
        test_local
        ;;
    "cleanup")
        cleanup
        ;;
    "help"|*)
        help
        ;;
esac