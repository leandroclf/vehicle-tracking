#!/usr/bin/env pwsh
# Script de Validação do Ambiente Local - Yukz Vehicle Tracking
# Execução: .\scripts\validate-local-env.ps1

param(
    [switch]$SkipInstall,
    [switch]$Verbose
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 Iniciando validação do ambiente local..." -ForegroundColor Green

# Função para verificar se um comando existe
function Test-Command {
    param($Command)
    try {
        Get-Command $Command -ErrorAction Stop | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

# Função para verificar se uma porta está em uso
function Test-Port {
    param($Port)
    try {
        $connection = Test-NetConnection -ComputerName localhost -Port $Port -WarningAction SilentlyContinue
        return $connection.TcpTestSucceeded
    }
    catch {
        return $false
    }
}

# Verificar pré-requisitos
Write-Host "📋 Verificando pré-requisitos..." -ForegroundColor Yellow

# Node.js
if (-not (Test-Command "node")) {
    Write-Error "❌ Node.js não encontrado. Instale Node.js v18+ primeiro."
    exit 1
}

$nodeVersion = node --version
Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green

# npm
if (-not (Test-Command "npm")) {
    Write-Error "❌ npm não encontrado."
    exit 1
}

$npmVersion = npm --version
Write-Host "✅ npm: v$npmVersion" -ForegroundColor Green

# Docker
if (-not (Test-Command "docker")) {
    Write-Error "❌ Docker não encontrado. Instale Docker Desktop primeiro."
    exit 1
}

try {
    $dockerVersion = docker --version
    Write-Host "✅ Docker: $dockerVersion" -ForegroundColor Green
}
catch {
    Write-Error "❌ Docker não está rodando. Inicie o Docker Desktop."
    exit 1
}

# Verificar se estamos no diretório correto
if (-not (Test-Path "package.json")) {
    Write-Error "❌ Execute este script no diretório raiz do projeto (onde está o package.json)."
    exit 1
}

# Instalar dependências
if (-not $SkipInstall) {
    Write-Host "📦 Instalando dependências..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Error "❌ Falha ao instalar dependências."
        exit 1
    }
    Write-Host "✅ Dependências instaladas" -ForegroundColor Green
}

# Verificar arquivo .env.local
Write-Host "🔧 Verificando configurações..." -ForegroundColor Yellow

if (-not (Test-Path ".env.local")) {
    Write-Warning "⚠️ Arquivo .env.local não encontrado. Criando com configurações padrão..."
    
    $envContent = @"
# Configurações para desenvolvimento local
DATABASE_URL="postgresql://postgres:postgres@localhost:54322/postgres"
REDIS_URL="redis://localhost:6379"

# Supabase Local
SUPABASE_URL="http://localhost:54321"
NEXT_PUBLIC_SUPABASE_URL="http://localhost:54321"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production"

# Site
NEXT_PUBLIC_SITE_URL="http://localhost:3000"

# Google Maps (opcional)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=""

# Tracker Server
TRACKER_SERVER_PORT=8080
TRACKER_SERVER_HOST=localhost

# Environment
NODE_ENV=development
"@
    
    $envContent | Out-File -FilePath ".env.local" -Encoding UTF8
    Write-Host "✅ Arquivo .env.local criado" -ForegroundColor Green
}
else {
    Write-Host "✅ Arquivo .env.local encontrado" -ForegroundColor Green
}

# Verificar configuração do Supabase
Write-Host "🗄️ Verificando Supabase..." -ForegroundColor Yellow

if (-not (Test-Path "supabase/config.toml")) {
    Write-Warning "⚠️ Arquivo supabase/config.toml não encontrado. Criando configuração básica..."
    
    if (-not (Test-Path "supabase")) {
        New-Item -ItemType Directory -Path "supabase" | Out-Null
    }
    
    $configContent = @"
# A string used to distinguish different Supabase projects on the same host. Defaults to the
# working directory name when running `supabase init`.
project_id = "vehicle-tracking"

[api]
enabled = true
# Port to use for the API URL.
port = 54321
# Schemas to expose in your API. Tables, views and stored procedures in this schema will get API
# endpoints. public and storage are always included.
schemas = ["public", "storage", "graphql_public"]
# Extra schemas to add to the search_path of every request. public is always included.
extra_search_path = ["public", "extensions"]
# The maximum number of rows returns from a view, table, or stored procedure. Limits payload size
# for accidental or malicious requests.
max_rows = 1000

[db]
# Port to use for the local database URL.
port = 54322
# Port used by db diff command to initialize the shadow database.
shadow_port = 54320
# The database major version to use. This has to be the same as your remote database's. Run `SHOW
# server_version_num;` on the remote database to check.
major_version = 15

[realtime]
enabled = true
# Bind realtime via either IPv4 or IPv6. (default: IPv6)
ip_version = "IPv6"

[studio]
enabled = true
# Port to use for Supabase Studio.
port = 54323
# External URL of the API server that frontend connects to.
api_url = "http://localhost:54321"

# Email testing server. Emails sent with the local dev setup are not actually sent - rather, they
# are monitored, and you can view the emails that would have been sent from the web interface.
[inbucket]
enabled = true
# Port to use for the email testing server web interface.
port = 54324
# Uncomment to expose additional ports for testing user applications that send emails.
# smtp_port = 2500
# pop3_port = 1100

[storage]
enabled = true
# The maximum file size allowed (e.g. "5MB", "500KB").
file_size_limit = "50MiB"

[auth]
enabled = true
# The base URL of your website. Used as an allow-list for redirects and for constructing URLs used
# in emails.
site_url = "http://localhost:3000"
# A list of *exact* URLs that auth providers are permitted to redirect to post authentication.
additional_redirect_urls = ["https://localhost:3000"]
# How long tokens are valid for, in seconds. Defaults to 3600 (1 hour), maximum 604800 (1 week).
jwt_expiry = 3600
# If disabled, the refresh token will never expire.
enable_refresh_token_rotation = true
# Allows refresh tokens to be reused after expiry, up to the specified interval in seconds.
# Requires enable_refresh_token_rotation = true.
refresh_token_reuse_interval = 10
# Allow/disallow new user signups to your project.
enable_signup = true

[auth.email]
# Allow/disallow new user signups via email to your project.
enable_signup = true
# If enabled, a user will be required to confirm any email change on both the old, and new email
# addresses. If disabled, only the new email is required to confirm.
double_confirm_changes = true
# If enabled, users need to confirm their email address before signing in.
enable_confirmations = false

# Uncomment to customize email template
# [auth.email.template.invite]
# subject = "You have been invited"
# content_path = "./supabase/templates/invite.html"

[auth.sms]
# Allow/disallow new user signups via SMS to your project.
enable_signup = true
# If enabled, users need to confirm their phone number before signing in.
enable_confirmations = false
# Template for sending a confirmation OTP via SMS.
# Must contain a {{ .Code }} placeholder for the verification code.
template = "Your code is {{ .Code }} ."

# Use pre-defined map of phone number to OTP for testing.
# [auth.sms.test_otp]
# 4152127777 = "123456"

# Configure one of the supported SMS providers: `twilio`, `twilio_verify`, `messagebird`, `textlocal`, `vonage`.
# [auth.sms.twilio]
# account_sid = ""
# message_service_sid = ""
# # DO NOT commit your Twilio auth token to git. Use environment variable substitution instead:
# auth_token = "env(SUPABASE_AUTH_SMS_TWILIO_AUTH_TOKEN)"

# Use an external OAuth provider. The full list of providers are: `apple`, `azure`, `bitbucket`,
# `discord`, `facebook`, `github`, `gitlab`, `google`, `keycloak`, `linkedin`, `notion`, `twitch`,
# `twitter`, `slack`, `spotify`, `workos`, `zoom`.
# [auth.external.apple]
# enabled = true
# client_id = ""
# # DO NOT commit your OAuth provider secret to git. Use environment variable substitution instead:
# secret = "env(SUPABASE_AUTH_EXTERNAL_APPLE_SECRET)"
# # Overrides the default auth redirectUrl.
# redirect_uri = ""
# # Overrides the default auth provider URL. Used to support self-hosted gitlab, single-tenant Azure,
# # or any other third-party OIDC providers.
# url = ""

[analytics]
enabled = false
port = 54327
vector_port = 9001
# Configure one of the supported backends: `postgres`, `bigquery`.
backend = "postgres"

[functions]
# A mapping of function names to their corresponding Docker image.
[functions._function_name]
verify_jwt = false
"@
    
    $configContent | Out-File -FilePath "supabase/config.toml" -Encoding UTF8
    Write-Host "✅ Arquivo supabase/config.toml criado" -ForegroundColor Green
}
else {
    Write-Host "✅ Arquivo supabase/config.toml encontrado" -ForegroundColor Green
}

# Verificar se Supabase CLI está disponível
if (-not (Test-Command "npx")) {
    Write-Error "❌ npx não encontrado."
    exit 1
}

# Iniciar Supabase se não estiver rodando
Write-Host "🚀 Verificando status do Supabase..." -ForegroundColor Yellow

$supabaseRunning = $false
try {
    $statusOutput = npx supabase status 2>&1
    if ($LASTEXITCODE -eq 0) {
        $supabaseRunning = $true
        Write-Host "✅ Supabase já está rodando" -ForegroundColor Green
        if ($Verbose) {
            Write-Host $statusOutput -ForegroundColor Gray
        }
    }
}
catch {
    # Supabase não está rodando
}

if (-not $supabaseRunning) {
    Write-Host "🔄 Iniciando Supabase local..." -ForegroundColor Yellow
    
    # Verificar se as portas estão livres
    $ports = @(54321, 54322, 54323, 54324)
    foreach ($port in $ports) {
        if (Test-Port $port) {
            Write-Warning "⚠️ Porta $port já está em uso. Isso pode causar conflitos."
        }
    }
    
    try {
        npx supabase start
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Supabase iniciado com sucesso" -ForegroundColor Green
        }
        else {
            Write-Error "❌ Falha ao iniciar Supabase"
            exit 1
        }
    }
    catch {
        Write-Error "❌ Erro ao iniciar Supabase: $_"
        exit 1
    }
}

# Verificar se Next.js está rodando
Write-Host "🌐 Verificando Next.js..." -ForegroundColor Yellow

$nextjsRunning = Test-Port 3000
if ($nextjsRunning) {
    Write-Host "✅ Next.js já está rodando na porta 3000" -ForegroundColor Green
}
else {
    Write-Host "ℹ️ Next.js não está rodando. Execute 'npm run dev' para iniciar." -ForegroundColor Blue
}

# Resumo final
Write-Host "`n🎉 Validação do ambiente concluída!" -ForegroundColor Green
Write-Host "📋 Resumo:" -ForegroundColor Yellow
Write-Host "  ✅ Node.js: $nodeVersion" -ForegroundColor White
Write-Host "  ✅ npm: v$npmVersion" -ForegroundColor White
Write-Host "  ✅ Docker: Funcionando" -ForegroundColor White
Write-Host "  ✅ Supabase: Configurado e rodando" -ForegroundColor White
Write-Host "  ✅ Configurações: .env.local criado" -ForegroundColor White

if (-not $nextjsRunning) {
    Write-Host "  ⚠️ Next.js: Não está rodando" -ForegroundColor Yellow
}
else {
    Write-Host "  ✅ Next.js: Rodando na porta 3000" -ForegroundColor White
}

Write-Host "`n🔗 URLs importantes:" -ForegroundColor Yellow
Write-Host "  • Aplicação: http://localhost:3000" -ForegroundColor White
Write-Host "  • Supabase Studio: http://localhost:54323" -ForegroundColor White
Write-Host "  • Supabase API: http://localhost:54321" -ForegroundColor White

if (-not $nextjsRunning) {
    Write-Host "`n🚀 Para iniciar o servidor de desenvolvimento:" -ForegroundColor Blue
    Write-Host "  npm run dev" -ForegroundColor White
}

Write-Host "`n📚 Para mais informações, consulte:" -ForegroundColor Blue
Write-Host "  docs/VALIDACAO_AMBIENTE_LOCAL.md" -ForegroundColor White