# Dockerfile para Aplicação Next.js Yukz

# Estágio de Build
FROM node:20-alpine AS builder

# Define o diretório de trabalho
WORKDIR /app

# Copia os arquivos de gerenciamento de pacotes
COPY package.json package-lock.json* ./

# Instala as dependências (usando --legacy-peer-deps conforme necessário anteriormente)
RUN npm install --legacy-peer-deps

# Copia o restante do código da aplicação
COPY . .

# Garante que a dependência do Supabase esteja instalada
RUN npm install @supabase/supabase-js --legacy-peer-deps

# Compila a aplicação Next.js para produção
# Nota: Não usamos mais 'build:worker' pois estamos migrando do Cloudflare
RUN npm run build

# Remove dependências de desenvolvimento
RUN npm prune --production

# Estágio de Runtime
FROM node:20-alpine AS runner

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

