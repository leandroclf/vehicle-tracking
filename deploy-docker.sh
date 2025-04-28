#!/bin/bash

# Script para construir e executar o contêiner Docker do sistema de rastreamento veicular Yukz

# Cores para saída no terminal
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
NC="\033[0m" # No Color

echo -e "${YELLOW}=== Iniciando implantação do sistema de rastreamento veicular Yukz ===${NC}"

# Verificar se o Docker está instalado
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker não encontrado. Por favor, instale o Docker primeiro.${NC}"
    exit 1
fi

# Solicitar variáveis de ambiente se não estiverem definidas
if [ -z "$GOOGLE_MAPS_API_KEY" ]; then
    read -p "Digite sua chave de API do Google Maps: " GOOGLE_MAPS_API_KEY
fi

if [ -z "$SUPABASE_URL" ]; then
    read -p "Digite a URL do Supabase: " SUPABASE_URL
fi

if [ -z "$SUPABASE_ANON_KEY" ]; then
    read -p "Digite a chave anônima do Supabase: " SUPABASE_ANON_KEY
fi

if [ -z "$JWT_SECRET" ]; then
    read -p "Digite a chave secreta JWT: " JWT_SECRET
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    read -p "Digite a chave de serviço do Supabase: " SUPABASE_SERVICE_ROLE_KEY
fi

# Construir a imagem Docker
echo -e "${YELLOW}Construindo a imagem Docker...${NC}"
docker build -t yukz-vehicle-tracking .

# Verificar se a construção foi bem-sucedida
if [ $? -ne 0 ]; then
    echo -e "${RED}Falha ao construir a imagem Docker.${NC}"
    exit 1
fi

# Executar o contêiner
echo -e "${YELLOW}Executando o contêiner...${NC}"
docker run -p 3000:3000 \
  -e GOOGLE_MAPS_API_KEY="$GOOGLE_MAPS_API_KEY" \
  -e SUPABASE_URL="$SUPABASE_URL" \
  -e SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY" \
  -e JWT_SECRET="$JWT_SECRET" \
  -e SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY" \
  yukz-vehicle-tracking

echo -e "${GREEN}Aplicação iniciada em http://localhost:3000${NC}"