# Estágio de build
FROM node:20-alpine AS builder

# Definir variáveis de ambiente para build
ARG DATABASE_URL

# Definir variáveis de ambiente
ENV DATABASE_URL=${DATABASE_URL}

WORKDIR /app

# Copiar arquivos de configuração e dependências
COPY package.json ./

# Instalar dependências apenas de produção
RUN npm install --only=production && \
    npm cache clean --force

# Copiar o código-fonte
COPY . .

# Estágio de execução
FROM node:20-alpine AS runner

WORKDIR /app

# Definir variáveis de ambiente para runtime
ENV NODE_ENV=production
ENV DATABASE_URL=${DATABASE_URL}
ENV TRACKER_TCP_PORT=5027
ENV TRACKER_UDP_PORT=5028
ENV QUECLINK_TCP_PORT=5029
ENV CONCOX_TCP_PORT=5030

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
COPY --from=builder --chown=nodeapp:nodejs /app/queclink-decoder.js ./
COPY --from=builder --chown=nodeapp:nodejs /app/concox-decoder.js ./

# Mudar para usuário não-root
USER nodeapp

# Expor portas do servidor de rastreamento
EXPOSE 5027
EXPOSE 5028
EXPOSE 5029
EXPOSE 5030

# Comando para iniciar o servidor
CMD ["node", "server.js"]