#!/bin/bash

# Script para construir e executar os contêineres Docker do sistema de rastreamento veicular Yukz

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

# Criar arquivo .env se não existir
if [ ! -f .env ]; then
    echo "Criando arquivo .env..."
    touch .env
fi

# Solicitar variáveis de ambiente se não estiverem definidas
if [ -z "$GOOGLE_MAPS_API_KEY" ]; then
    read -p "Digite sua chave de API do Google Maps: " GOOGLE_MAPS_API_KEY
    echo "GOOGLE_MAPS_API_KEY=$GOOGLE_MAPS_API_KEY" >> .env
fi

if [ -z "$SUPABASE_URL" ]; then
    read -p "Digite a URL do Supabase: " SUPABASE_URL
    echo "SUPABASE_URL=$SUPABASE_URL" >> .env
fi

if [ -z "$SUPABASE_ANON_KEY" ]; then
    read -p "Digite a chave anônima do Supabase: " SUPABASE_ANON_KEY
    echo "SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY" >> .env
fi

if [ -z "$JWT_SECRET" ]; then
    read -p "Digite a chave secreta JWT: " JWT_SECRET
    echo "JWT_SECRET=$JWT_SECRET" >> .env
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    read -p "Digite a chave de serviço do Supabase: " SUPABASE_SERVICE_ROLE_KEY
    echo "SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY" >> .env
fi

if [ -z "$TRACKER_TCP_PORT" ]; then
    read -p "Digite a porta TCP para o servidor de rastreamento [5027]: " TRACKER_TCP_PORT
    TRACKER_TCP_PORT=${TRACKER_TCP_PORT:-5027}
    echo "TRACKER_TCP_PORT=$TRACKER_TCP_PORT" >> .env
fi

if [ -z "$TRACKER_UDP_PORT" ]; then
    read -p "Digite a porta UDP para o servidor de rastreamento [5028]: " TRACKER_UDP_PORT
    TRACKER_UDP_PORT=${TRACKER_UDP_PORT:-5028}
    echo "TRACKER_UDP_PORT=$TRACKER_UDP_PORT" >> .env
fi

# Perguntar qual serviço deseja executar
PS3="Selecione a opção de implantação: "
options=("Frontend (Next.js)" "Servidor de Rastreamento" "Ambos" "Sair")
select opt in "${options[@]}"
do
    case $opt in
        "Frontend (Next.js)")
            # Construir a imagem Docker do frontend
            echo -e "${YELLOW}Construindo a imagem Docker do frontend...${NC}"
            docker build --target nextjs -t yukz-frontend .
            
            # Verificar se a construção foi bem-sucedida
            if [ $? -ne 0 ]; then
                echo -e "${RED}Falha ao construir a imagem Docker do frontend.${NC}"
                exit 1
            fi
            
            # Executar o contêiner do frontend
            echo -e "${YELLOW}Executando o contêiner do frontend...${NC}"
            docker run -d -p 3000:3000 \
              --env-file .env \
              --name yukz-frontend-container \
              yukz-frontend
            
            echo -e "${GREEN}Aplicação frontend iniciada em http://localhost:3000${NC}"
            break
            ;;
        "Servidor de Rastreamento")
            # Construir a imagem Docker do servidor de rastreamento
            echo -e "${YELLOW}Construindo a imagem Docker do servidor de rastreamento...${NC}"
            docker build --target tracker -t yukz-tracker .
            
            # Verificar se a construção foi bem-sucedida
            if [ $? -ne 0 ]; then
                echo -e "${RED}Falha ao construir a imagem Docker do servidor de rastreamento.${NC}"
                exit 1
            fi
            
            # Executar o contêiner do servidor de rastreamento
            echo -e "${YELLOW}Executando o contêiner do servidor de rastreamento...${NC}"
            docker run -d \
              -p ${TRACKER_TCP_PORT:-5027}:5027/tcp \
              -p ${TRACKER_UDP_PORT:-5028}:5028/udp \
              --env-file .env \
              --name yukz-tracker-container \
              yukz-tracker
            
            echo -e "${GREEN}Servidor de rastreamento iniciado nas portas TCP ${TRACKER_TCP_PORT:-5027} e UDP ${TRACKER_UDP_PORT:-5028}${NC}"
            break
            ;;
        "Ambos")
            # Construir ambas as imagens Docker
            echo -e "${YELLOW}Construindo as imagens Docker...${NC}"
            
            echo -e "${YELLOW}1. Construindo imagem do frontend...${NC}"
            docker build --target nextjs -t yukz-frontend .
            if [ $? -ne 0 ]; then
                echo -e "${RED}Falha ao construir a imagem Docker do frontend.${NC}"
                exit 1
            fi
            
            echo -e "${YELLOW}2. Construindo imagem do servidor de rastreamento...${NC}"
            docker build --target tracker -t yukz-tracker .
            if [ $? -ne 0 ]; then
                echo -e "${RED}Falha ao construir a imagem Docker do servidor de rastreamento.${NC}"
                exit 1
            fi
            
            # Executar os contêineres
            echo -e "${YELLOW}Executando os contêineres...${NC}"
            
            docker run -d -p 3000:3000 \
              --env-file .env \
              --name yukz-frontend-container \
              yukz-frontend
              
            docker run -d \
              -p ${TRACKER_TCP_PORT:-5027}:5027/tcp \
              -p ${TRACKER_UDP_PORT:-5028}:5028/udp \
              --env-file .env \
              --name yukz-tracker-container \
              yukz-tracker
            
            echo -e "${GREEN}Aplicação frontend iniciada em http://localhost:3000${NC}"
            echo -e "${GREEN}Servidor de rastreamento iniciado nas portas TCP ${TRACKER_TCP_PORT:-5027} e UDP ${TRACKER_UDP_PORT:-5028}${NC}"
            break
            ;;
        "Sair")
            echo -e "${YELLOW}Operação cancelada pelo usuário.${NC}"
            exit 0
            ;;
        *) 
            echo -e "${RED}Opção inválida. Por favor, tente novamente.${NC}"
            ;;
    esac
done

echo -e "${GREEN}Implantação concluída com sucesso!${NC}"