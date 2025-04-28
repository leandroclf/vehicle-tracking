# Script PowerShell para construir e executar o contêiner Docker do sistema de rastreamento veicular Yukz

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

# Solicitar variáveis de ambiente se não estiverem definidas
if (-not $env:NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    $env:NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = Read-Host "Digite sua chave de API do Google Maps"
}

if (-not $env:NEXT_PUBLIC_SUPABASE_URL) {
    $env:NEXT_PUBLIC_SUPABASE_URL = Read-Host "Digite a URL do Supabase"
}

if (-not $env:NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    $env:NEXT_PUBLIC_SUPABASE_ANON_KEY = Read-Host "Digite a chave anônima do Supabase"
}

if (-not $env:JWT_SECRET) {
    $env:JWT_SECRET = Read-Host "Digite a chave secreta JWT"
}

if (-not $env:SUPABASE_SERVICE_KEY) {
    $env:SUPABASE_SERVICE_KEY = Read-Host "Digite a chave de serviço do Supabase"
}

# Construir a imagem Docker
Write-Host "${Yellow}Construindo a imagem Docker...${NC}"
docker build -t yukz-vehicle-tracking .

# Verificar se a construção foi bem-sucedida
if ($LASTEXITCODE -ne 0) {
    Write-Host "${Red}Falha ao construir a imagem Docker.${NC}"
    exit 1
}

# Executar o contêiner
Write-Host "${Yellow}Executando o contêiner...${NC}"
docker run -p 3000:3000 `
  -e NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="$env:NEXT_PUBLIC_GOOGLE_MAPS_API_KEY" `
  -e NEXT_PUBLIC_SUPABASE_URL="$env:NEXT_PUBLIC_SUPABASE_URL" `
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY="$env:NEXT_PUBLIC_SUPABASE_ANON_KEY" `
  -e JWT_SECRET="$env:JWT_SECRET" `
  -e SUPABASE_SERVICE_KEY="$env:SUPABASE_SERVICE_KEY" `
  yukz-vehicle-tracking

Write-Host "${Green}Aplicação iniciada em http://localhost:3000${NC}"