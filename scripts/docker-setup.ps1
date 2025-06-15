# Script PowerShell para configuração Docker do sistema de rastreamento veicular
# Este script configura todo o ambiente de desenvolvimento/produção no Windows

param(
    [switch]$Clean,
    [switch]$Restart,
    [switch]$Logs,
    [switch]$Help
)

# Configurar cores para output
$ErrorActionPreference = "Stop"

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

function Log-Info {
    param([string]$Message)
    Write-ColorOutput "[INFO] $Message" "Blue"
}

function Log-Success {
    param([string]$Message)
    Write-ColorOutput "[SUCCESS] $Message" "Green"
}

function Log-Warning {
    param([string]$Message)
    Write-ColorOutput "[WARNING] $Message" "Yellow"
}

function Log-Error {
    param([string]$Message)
    Write-ColorOutput "[ERROR] $Message" "Red"
}

# Verificar se Docker está instalado
function Test-Docker {
    try {
        $dockerVersion = docker --version 2>$null
        $composeVersion = docker-compose --version 2>$null
        
        if (-not $dockerVersion) {
            Log-Error "Docker não está instalado. Por favor, instale o Docker Desktop primeiro."
            exit 1
        }
        
        if (-not $composeVersion) {
            Log-Error "Docker Compose não está instalado. Por favor, instale o Docker Compose primeiro."
            exit 1
        }
        
        Log-Success "Docker e Docker Compose encontrados"
    }
    catch {
        Log-Error "Erro ao verificar Docker: $($_.Exception.Message)"
        exit 1
    }
}

# Criar arquivo .env se não existir
function Setup-Environment {
    if (-not (Test-Path ".env")) {
        Log-Info "Criando arquivo .env..."
        
        $envContent = @"
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
"@
        
        $envContent | Out-File -FilePath ".env" -Encoding UTF8
        Log-Success "Arquivo .env criado. Por favor, configure as variáveis necessárias."
        Log-Warning "IMPORTANTE: Configure as chaves do Supabase e Google Maps no arquivo .env"
    }
    else {
        Log-Info "Arquivo .env já existe"
    }
}

# Verificar se os arquivos necessários existem
function Test-RequiredFiles {
    $requiredFiles = @(
        "docker-compose.full.yml",
        "migrations\unified_schema.sql",
        "migrations\create_rpc_functions.sql",
        "scripts\init-data.sql",
        "Dockerfile",
        "tracker-server\Dockerfile"
    )
    
    foreach ($file in $requiredFiles) {
        if (-not (Test-Path $file)) {
            Log-Error "Arquivo necessário não encontrado: $file"
            exit 1
        }
    }
    
    Log-Success "Todos os arquivos necessários encontrados"
}

# Parar containers existentes
function Stop-Containers {
    Log-Info "Parando containers existentes..."
    try {
        docker-compose -f docker-compose.full.yml down --remove-orphans 2>$null
        Log-Success "Containers parados"
    }
    catch {
        Log-Warning "Nenhum container estava rodando"
    }
}

# Limpar volumes (opcional)
function Remove-Volumes {
    if ($Clean) {
        Log-Warning "Removendo volumes existentes..."
        try {
            docker volume rm yukz_postgres_data 2>$null
            docker volume rm yukz_redis_data 2>$null
            Log-Success "Volumes removidos"
        }
        catch {
            Log-Warning "Alguns volumes podem não ter existido"
        }
    }
}

# Construir imagens
function Build-Images {
    Log-Info "Construindo imagens Docker..."
    try {
        docker-compose -f docker-compose.full.yml build --no-cache
        Log-Success "Imagens construídas com sucesso"
    }
    catch {
        Log-Error "Erro ao construir imagens: $($_.Exception.Message)"
        exit 1
    }
}

# Iniciar serviços
function Start-Services {
    Log-Info "Iniciando serviços..."
    
    try {
        # Iniciar apenas o banco de dados primeiro
        Log-Info "Iniciando PostgreSQL..."
        docker-compose -f docker-compose.full.yml up -d postgres
        
        # Aguardar o banco estar pronto
        Log-Info "Aguardando PostgreSQL ficar pronto..."
        $timeout = 60
        $elapsed = 0
        do {
            Start-Sleep -Seconds 2
            $elapsed += 2
            try {
                $result = docker-compose -f docker-compose.full.yml exec postgres pg_isready -U postgres -d vehicle_tracking 2>$null
                if ($LASTEXITCODE -eq 0) { break }
            }
            catch { }
        } while ($elapsed -lt $timeout)
        
        if ($elapsed -ge $timeout) {
            Log-Error "Timeout aguardando PostgreSQL"
            exit 1
        }
        
        # Iniciar Redis
        Log-Info "Iniciando Redis..."
        docker-compose -f docker-compose.full.yml up -d redis
        
        # Aguardar Redis estar pronto
        Log-Info "Aguardando Redis ficar pronto..."
        $timeout = 30
        $elapsed = 0
        do {
            Start-Sleep -Seconds 2
            $elapsed += 2
            try {
                $result = docker-compose -f docker-compose.full.yml exec redis redis-cli ping 2>$null
                if ($LASTEXITCODE -eq 0) { break }
            }
            catch { }
        } while ($elapsed -lt $timeout)
        
        # Iniciar aplicação
        Log-Info "Iniciando aplicação..."
        docker-compose -f docker-compose.full.yml up -d app
        
        # Iniciar servidor de rastreamento
        Log-Info "Iniciando servidor de rastreamento..."
        docker-compose -f docker-compose.full.yml up -d tracker-server
        
        Log-Success "Todos os serviços iniciados"
    }
    catch {
        Log-Error "Erro ao iniciar serviços: $($_.Exception.Message)"
        exit 1
    }
}

# Verificar status dos serviços
function Test-Services {
    Log-Info "Verificando status dos serviços..."
    
    Start-Sleep -Seconds 10  # Aguardar um pouco para os serviços iniciarem
    
    # Verificar PostgreSQL
    try {
        docker-compose -f docker-compose.full.yml exec postgres pg_isready -U postgres -d vehicle_tracking 2>$null
        if ($LASTEXITCODE -eq 0) {
            Log-Success "PostgreSQL: ✓ Online"
        }
        else {
            Log-Error "PostgreSQL: ✗ Offline"
        }
    }
    catch {
        Log-Error "PostgreSQL: ✗ Offline"
    }
    
    # Verificar Redis
    try {
        docker-compose -f docker-compose.full.yml exec redis redis-cli ping 2>$null
        if ($LASTEXITCODE -eq 0) {
            Log-Success "Redis: ✓ Online"
        }
        else {
            Log-Error "Redis: ✗ Offline"
        }
    }
    catch {
        Log-Error "Redis: ✗ Offline"
    }
    
    # Verificar aplicação
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5 -UseBasicParsing 2>$null
        Log-Success "Aplicação: ✓ Online (http://localhost:3000)"
    }
    catch {
        Log-Warning "Aplicação: ⚠ Iniciando... (aguarde alguns minutos)"
    }
    
    # Verificar servidor de rastreamento
    try {
        $tcpClient = New-Object System.Net.Sockets.TcpClient
        $tcpClient.Connect("localhost", 5027)
        $tcpClient.Close()
        Log-Success "Servidor de Rastreamento: ✓ Online (porta 5027)"
    }
    catch {
        Log-Warning "Servidor de Rastreamento: ⚠ Iniciando..."
    }
}

# Mostrar logs
function Show-Logs {
    if ($Logs) {
        Log-Info "Mostrando logs dos serviços..."
        docker-compose -f docker-compose.full.yml logs -f
    }
}

# Mostrar informações de acesso
function Show-AccessInfo {
    Write-Host ""
    Log-Success "=== SISTEMA CONFIGURADO COM SUCESSO ==="
    Write-Host ""
    Write-Host "🌐 Aplicação Principal: http://localhost:3000" -ForegroundColor Cyan
    Write-Host "🗄️  Adminer (DB Admin): http://localhost:8080" -ForegroundColor Cyan
    Write-Host "📊 PostgreSQL: localhost:5432" -ForegroundColor Cyan
    Write-Host "🔄 Redis: localhost:6379" -ForegroundColor Cyan
    Write-Host "📡 Servidor Rastreamento:" -ForegroundColor Cyan
    Write-Host "   - Teltonika TCP: localhost:5027" -ForegroundColor Gray
    Write-Host "   - UDP: localhost:5028" -ForegroundColor Gray
    Write-Host "   - Queclink TCP: localhost:5029" -ForegroundColor Gray
    Write-Host "   - Concox TCP: localhost:5030" -ForegroundColor Gray
    Write-Host ""
    Write-Host "👤 Usuários de teste:" -ForegroundColor Yellow
    Write-Host "   - admin@yukz.com / admin123" -ForegroundColor Gray
    Write-Host "   - teste@yukz.com / teste123" -ForegroundColor Gray
    Write-Host ""
    Write-Host "📋 Comandos úteis:" -ForegroundColor Yellow
    Write-Host "   - Ver logs: docker-compose -f docker-compose.full.yml logs -f" -ForegroundColor Gray
    Write-Host "   - Parar: docker-compose -f docker-compose.full.yml down" -ForegroundColor Gray
    Write-Host "   - Reiniciar: .\scripts\docker-setup.ps1 -Restart" -ForegroundColor Gray
    Write-Host ""
}

# Mostrar ajuda
function Show-Help {
    Write-Host "Uso: .\scripts\docker-setup.ps1 [opções]" -ForegroundColor Yellow
    Write-Host "Opções:" -ForegroundColor Yellow
    Write-Host "  -Clean     Remove volumes existentes antes de iniciar" -ForegroundColor Gray
    Write-Host "  -Restart   Reinicia os serviços" -ForegroundColor Gray
    Write-Host "  -Logs      Mostra logs dos serviços" -ForegroundColor Gray
    Write-Host "  -Help      Mostra esta ajuda" -ForegroundColor Gray
}

# Função principal
function Main {
    Write-Host "🚀 Configurando ambiente Docker para Sistema de Rastreamento Veicular" -ForegroundColor Magenta
    Write-Host ""
    
    # Verificar argumentos
    if ($Help) {
        Show-Help
        exit 0
    }
    
    if ($Restart) {
        Log-Info "Reiniciando serviços..."
        Stop-Containers
        Start-Services
        Test-Services
        Show-AccessInfo
        exit 0
    }
    
    if ($Logs) {
        Show-Logs
        exit 0
    }
    
    # Executar verificações e configuração
    Test-Docker
    Test-RequiredFiles
    Setup-Environment
    Stop-Containers
    Remove-Volumes
    Build-Images
    Start-Services
    Test-Services
    Show-AccessInfo
}

# Executar função principal
try {
    Main
}
catch {
    Log-Error "Erro durante a execução: $($_.Exception.Message)"
    exit 1
}