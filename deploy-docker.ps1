# Script PowerShell para construir e executar os contêineres Docker do sistema de rastreamento veicular Yukz

# Cores para saída no terminal
$Green = "\033[0;32m"
$Yellow = "\033[1;33m"
$Red = "\033[0;31m"
$NC = "\033[0m" # No Color

Write-Host "${Yellow}=== Iniciando implantação do sistema de rastreamento veicular Yukz ===${NC}"

# Verificar se o Docker está instalado
try {
    docker --version | Out-Null
} catch {
    Write-Host "${Red}Docker não encontrado. Por favor, instale o Docker Desktop para Windows primeiro.${NC}"
    exit 1
}

# Criar arquivo .env se não existir
if (-not (Test-Path -Path ".env")) {
    Write-Host "Criando arquivo .env..."
    New-Item -Path ".env" -ItemType File | Out-Null
}

# Solicitar variáveis de ambiente se não estiverem definidas
if (-not $env:GOOGLE_MAPS_API_KEY) {
    $env:GOOGLE_MAPS_API_KEY = Read-Host "Digite sua chave de API do Google Maps"
    Add-Content -Path ".env" -Value "GOOGLE_MAPS_API_KEY=$env:GOOGLE_MAPS_API_KEY"
}

if (-not $env:SUPABASE_URL) {
    $env:SUPABASE_URL = Read-Host "Digite a URL do Supabase"
    Add-Content -Path ".env" -Value "SUPABASE_URL=$env:SUPABASE_URL"
}

if (-not $env:SUPABASE_ANON_KEY) {
    $env:SUPABASE_ANON_KEY = Read-Host "Digite a chave anônima do Supabase"
    Add-Content -Path ".env" -Value "SUPABASE_ANON_KEY=$env:SUPABASE_ANON_KEY"
}

if (-not $env:JWT_SECRET) {
    $env:JWT_SECRET = Read-Host "Digite a chave secreta JWT"
    Add-Content -Path ".env" -Value "JWT_SECRET=$env:JWT_SECRET"
}

if (-not $env:SUPABASE_SERVICE_ROLE_KEY) {
    $env:SUPABASE_SERVICE_ROLE_KEY = Read-Host "Digite a chave de serviço do Supabase"
    Add-Content -Path ".env" -Value "SUPABASE_SERVICE_ROLE_KEY=$env:SUPABASE_SERVICE_ROLE_KEY"
}

if (-not $env:TRACKER_TCP_PORT) {
    $port = Read-Host "Digite a porta TCP para o servidor de rastreamento [5027]"
    if (-not $port) { $port = "5027" }
    $env:TRACKER_TCP_PORT = $port
    Add-Content -Path ".env" -Value "TRACKER_TCP_PORT=$env:TRACKER_TCP_PORT"
}

if (-not $env:TRACKER_UDP_PORT) {
    $port = Read-Host "Digite a porta UDP para o servidor de rastreamento [5028]"
    if (-not $port) { $port = "5028" }
    $env:TRACKER_UDP_PORT = $port
    Add-Content -Path ".env" -Value "TRACKER_UDP_PORT=$env:TRACKER_UDP_PORT"
}

# Selecionar qual serviço implantar
Write-Host "Selecione a opção de implantação:"
Write-Host "1. Frontend (Next.js)"
Write-Host "2. Servidor de Rastreamento"
Write-Host "3. Ambos"
Write-Host "4. Sair"

$option = Read-Host "Digite o número da opção desejada"

switch ($option) {
    "1" {
        # Construir a imagem Docker do frontend
        Write-Host "${Yellow}Construindo a imagem Docker do frontend...${NC}"
        docker build --target nextjs -t yukz-frontend .
        
        # Verificar se a construção foi bem-sucedida
        if ($LASTEXITCODE -ne 0) {
            Write-Host "${Red}Falha ao construir a imagem Docker do frontend.${NC}"
            exit 1
        }
        
        # Executar o contêiner do frontend
        Write-Host "${Yellow}Executando o contêiner do frontend...${NC}"
        docker run -d -p 3000:3000 `
            --env-file .env `
            --name yukz-frontend-container `
            yukz-frontend
        
        Write-Host "${Green}Aplicação frontend iniciada em http://localhost:3000${NC}"
    }
    "2" {
        # Construir a imagem Docker do servidor de rastreamento
        Write-Host "${Yellow}Construindo a imagem Docker do servidor de rastreamento...${NC}"
        docker build --target tracker -t yukz-tracker .
        
        # Verificar se a construção foi bem-sucedida
        if ($LASTEXITCODE -ne 0) {
            Write-Host "${Red}Falha ao construir a imagem Docker do servidor de rastreamento.${NC}"
            exit 1
        }
        
        # Executar o contêiner do servidor de rastreamento
        Write-Host "${Yellow}Executando o contêiner do servidor de rastreamento...${NC}"
        docker run -d `
            -p "$env:TRACKER_TCP_PORT`:5027/tcp" `
            -p "$env:TRACKER_UDP_PORT`:5028/udp" `
            --env-file .env `
            --name yukz-tracker-container `
            yukz-tracker
        
        Write-Host "${Green}Servidor de rastreamento iniciado nas portas TCP $env:TRACKER_TCP_PORT e UDP $env:TRACKER_UDP_PORT${NC}"
    }
    "3" {
        # Construir ambas as imagens Docker
        Write-Host "${Yellow}Construindo as imagens Docker...${NC}"
        
        Write-Host "${Yellow}1. Construindo imagem do frontend...${NC}"
        docker build --target nextjs -t yukz-frontend .
        if ($LASTEXITCODE -ne 0) {
            Write-Host "${Red}Falha ao construir a imagem Docker do frontend.${NC}"
            exit 1
        }
        
        Write-Host "${Yellow}2. Construindo imagem do servidor de rastreamento...${NC}"
        docker build --target tracker -t yukz-tracker .
        if ($LASTEXITCODE -ne 0) {
            Write-Host "${Red}Falha ao construir a imagem Docker do servidor de rastreamento.${NC}"
            exit 1
        }
        
        # Executar os contêineres
        Write-Host "${Yellow}Executando os contêineres...${NC}"
        
        docker run -d -p 3000:3000 `
            --env-file .env `
            --name yukz-frontend-container `
            yukz-frontend
        
        docker run -d `
            -p "$env:TRACKER_TCP_PORT`:5027/tcp" `
            -p "$env:TRACKER_UDP_PORT`:5028/udp" `
            --env-file .env `
            --name yukz-tracker-container `
            yukz-tracker
        
        Write-Host "${Green}Aplicação frontend iniciada em http://localhost:3000${NC}"
        Write-Host "${Green}Servidor de rastreamento iniciado nas portas TCP $env:TRACKER_TCP_PORT e UDP $env:TRACKER_UDP_PORT${NC}"
    }
    "4" {
        Write-Host "${Yellow}Operação cancelada pelo usuário.${NC}"
        exit 0
    }
    default {
        Write-Host "${Red}Opção inválida. Por favor, execute o script novamente.${NC}"
        exit 1
    }
}

Write-Host "${Green}Implantação concluída com sucesso!${NC}"