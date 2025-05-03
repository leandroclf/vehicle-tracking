# Dockerfile para Aplicação Next.js Yukz com Servidor de Rastreamento

# Estágio de Build
FROM node:20-alpine AS builder

# Define o diretório de trabalho
WORKDIR /app

# Copia os arquivos de gerenciamento de pacotes e requirements
COPY package.json package-lock.json* requirements.txt ./

# Instala as dependências (usando --legacy-peer-deps conforme necessário anteriormente)
RUN npm install --legacy-peer-deps

# Copia o restante do código da aplicação
COPY . .

# Constrói a aplicação Next.js
RUN npm run build

# Remove dependências de desenvolvimento
RUN npm prune --production

# Estágio de Runtime para Next.js
FROM node:20-alpine AS nextjs

# Define o diretório de trabalho
WORKDIR /app

# Define o ambiente para produção
ENV NODE_ENV=production

# Copia os artefatos de build do estágio anterior
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Expõe a porta que o Next.js usa (padrão 3000)
EXPOSE 3000

# Define o comando para iniciar a aplicação
CMD ["npm", "start"]

# Estágio de Runtime para o Servidor de Rastreamento
FROM node:20-alpine AS tracker

# Define o diretório de trabalho
WORKDIR /app

# Define o ambiente para produção
ENV NODE_ENV=production

# Copia apenas os arquivos necessários para o servidor de rastreamento
COPY tracker-server/package.json ./
COPY tracker-server/server.js ./
COPY tracker-server/teltonika-decoder.js ./
COPY .env ./

# Instala apenas as dependências do servidor de rastreamento
RUN npm install

# Expõe as portas TCP e UDP para o servidor de rastreamento
EXPOSE 5027/tcp
EXPOSE 5028/udp

# Define o comando para iniciar o servidor de rastreamento
CMD ["node", "server.js"]

# Observação: Este Dockerfile define dois serviços separados.
# Para implantação, você precisará escolher qual imagem construir:
# - Para o frontend Next.js: docker build --target nextjs -t yukz-frontend .
# - Para o servidor de rastreamento: docker build --target tracker -t yukz-tracker .

