# Estágio de build
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar arquivos de configuração e dependências
COPY package.json ./

# Instalar dependências
RUN npm install

# Copiar o código-fonte
COPY . .

# Estágio de execução
FROM node:18-alpine AS runner

WORKDIR /app

# Definir variáveis de ambiente para runtime
ENV NODE_ENV=production
ENV PORT=8090

# Criar usuário não-root
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodeapp && \
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