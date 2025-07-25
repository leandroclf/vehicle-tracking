@echo off
REM Script de desenvolvimento rápido para Vehicle Tracking (Windows)
REM Uso: dev.bat [comando]

setlocal enabledelayedexpansion

REM Função para log colorido (simulado)
:log
echo [%date% %time%] %~1
goto :eof

:warn
echo [WARNING] %~1
goto :eof

:error
echo [ERROR] %~1
exit /b 1

REM Função para verificar se Docker está rodando
:check_docker
docker info >nul 2>&1
if errorlevel 1 (
    call :error "Docker não está rodando. Por favor, inicie o Docker Desktop."
)
goto :eof

REM Função para verificar dependências
:check_dependencies
if not exist "node_modules" (
    call :log "Instalando dependências da aplicação..."
    npm install
)

if not exist "tracker-server\node_modules" (
    call :log "Instalando dependências do tracker server..."
    cd tracker-server
    npm install
    cd ..
)
goto :eof

REM Função para limpeza
:cleanup
call :log "Limpando containers e cache antigos..."
docker-compose -f docker-compose.dev.yml down --remove-orphans >nul 2>&1
docker-compose -f docker-compose.yml down --remove-orphans >nul 2>&1
docker system prune -f
goto :eof

REM Função para desenvolvimento
:dev
call :log "Iniciando ambiente de desenvolvimento com hot reload..."
call :check_docker
call :check_dependencies

REM Para containers existentes
docker-compose -f docker-compose.dev.yml down >nul 2>&1

REM Inicia em modo desenvolvimento
docker-compose -f docker-compose.dev.yml up --build
goto :eof

REM Função para desenvolvimento em background
:dev_bg
call :log "Iniciando ambiente de desenvolvimento em background..."
call :check_docker
call :check_dependencies

REM Para containers existentes
docker-compose -f docker-compose.dev.yml down >nul 2>&1

REM Inicia em modo desenvolvimento em background
docker-compose -f docker-compose.dev.yml up --build -d

call :log "Ambiente iniciado! Acesse:"
call :log "  - Aplicação: http://localhost:3000"
call :log "  - Tracker Server: localhost:8080-8083"
echo.
call :log "Para ver logs: docker-compose -f docker-compose.dev.yml logs -f"
call :log "Para parar: docker-compose -f docker-compose.dev.yml down"
goto :eof

REM Função para produção
:prod
call :log "Iniciando ambiente de produção..."
call :check_docker

REM Para containers existentes
docker-compose down >nul 2>&1

REM Constrói e inicia produção
docker-compose up --build -d

call :log "Ambiente de produção iniciado!"
call :log "  - Aplicação: http://localhost:3000"
call :log "  - Tracker Server: localhost:8080-8083"
goto :eof

REM Função para build
:build
call :log "Construindo imagens..."
call :check_docker

REM Build paralelo com cache
docker-compose build --parallel

call :log "Build concluído!"
goto :eof

REM Função para logs
:logs
set service=%~1
if "%service%"=="" (
    call :log "Mostrando logs de todos os serviços..."
    docker-compose -f docker-compose.dev.yml logs -f
) else (
    call :log "Mostrando logs do serviço: %service%"
    docker-compose -f docker-compose.dev.yml logs -f %service%
)
goto :eof

REM Função para status
:status
call :log "Status dos containers:"
docker ps -a --filter "name=yukz" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
goto :eof

REM Função para restart
:restart
call :log "Reiniciando ambiente de desenvolvimento..."
docker-compose -f docker-compose.dev.yml restart
call :log "Ambiente reiniciado!"
goto :eof

REM Função para shell
:shell
set service=%~1
if "%service%"=="" set service=app

call :log "Acessando shell do serviço: %service%"

if "%service%"=="app" (
    docker exec -it yukz-app-dev sh
) else if "%service%"=="tracker" (
    docker exec -it yukz-tracker-server-dev sh
) else (
    call :error "Serviço inválido. Use 'app' ou 'tracker'"
)
goto :eof

REM Função para teste local
:test_local
call :log "Executando testes locais..."
npm test

call :log "Testando build local..."
npm run build

call :log "Testes concluídos!"
goto :eof

REM Função para ajuda
:help
echo Vehicle Tracking - Script de Desenvolvimento (Windows)
echo.
echo Uso: %~nx0 [comando]
echo.
echo Comandos disponíveis:
echo   dev         - Inicia desenvolvimento com hot reload
echo   dev-bg      - Inicia desenvolvimento em background
echo   prod        - Inicia ambiente de produção
echo   build       - Constrói imagens Docker
echo   logs [srv]  - Mostra logs (opcional: app, tracker)
echo   status      - Mostra status dos containers
echo   restart     - Reinicia ambiente de desenvolvimento
echo   shell [srv] - Acessa shell (app ou tracker)
echo   test        - Executa testes locais
echo   cleanup     - Limpa containers e cache
echo   help        - Mostra esta ajuda
echo.
echo Exemplos:
echo   %~nx0 dev              # Desenvolvimento com logs
echo   %~nx0 dev-bg           # Desenvolvimento em background
echo   %~nx0 logs app         # Logs apenas da aplicação
echo   %~nx0 shell tracker    # Shell do tracker server
goto :eof

REM Main
set command=%~1
if "%command%"=="" set command=help

if "%command%"=="dev" goto :dev
if "%command%"=="dev-bg" goto :dev_bg
if "%command%"=="prod" goto :prod
if "%command%"=="build" goto :build
if "%command%"=="logs" goto :logs %~2
if "%command%"=="status" goto :status
if "%command%"=="restart" goto :restart
if "%command%"=="shell" goto :shell %~2
if "%command%"=="test" goto :test_local
if "%command%"=="cleanup" goto :cleanup
if "%command%"=="help" goto :help

goto :help