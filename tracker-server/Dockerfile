# Estágio de build
FROM node:18-alpine AS builder

# Definir variáveis de ambiente para build
ARG SUPABASE_URL
ARG SUPABASE_SERVICE_ROLE_KEY

# Definir variáveis de ambiente
ENV SUPABASE_URL=${SUPABASE_URL}
ENV SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}

WORKDIR /app

# Copiar arquivos de configuração e dependências
COPY package.json ./

# Instalar dependências apenas de produção
RUN npm install --only=production && \
    npm cache clean --force

# Copiar o código-fonte
COPY . .

# Estágio de execução
FROM node:18-alpine AS runner

WORKDIR /app

# Definir variáveis de ambiente para runtime
ENV NODE_ENV=production
ENV PORT=8090
ENV SUPABASE_URL=${SUPABASE_URL}
ENV SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}

# Criar usuário não-root
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodeapp && \
    mkdir -p /app/node_modules && \
    chown -R nodeapp:nodejs /app

# Copiar apenas os arquivos necessários
COPY --from=builder --chown=nodeapp:nodejs /app/package.json ./
COPY --from=builder --chown=nodeapp:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodeapp:nodejs /app/server.js ./
COPY --from=builder --chown=nodeapp:nodejs /app/teltonika-decoder.js ./

# Mudar para usuário não-root
USER nodeapp

# Expor porta do servidor de rastreamento
EXPOSE 8090

# Comando para iniciar o servidor
CMD ["node", "server.js"]