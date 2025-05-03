# Estágio de build
FROM node:18-alpine AS builder

# Definir variáveis de ambiente para build
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

# Definir variáveis de ambiente públicas
ENV NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
ENV NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=${NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}

WORKDIR /app

# Copiar arquivos de configuração e dependências
COPY package.json package-lock.json ./

# Instalar dependências
RUN npm ci

# Copiar o restante do código-fonte
COPY . .

# Gerar build de produção com ESLint ignorado
RUN DISABLE_ESLINT_PLUGIN=true npm run build

# Estágio de execução
FROM node:18-alpine AS runner

WORKDIR /app

# Criar usuário não-root
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    chown -R nextjs:nodejs /app

# Definir variáveis de ambiente para runtime
ENV NODE_ENV=production
ENV PORT=3000

# Copiar arquivos necessários do estágio de build
COPY --from=builder --chown=nextjs:nodejs /app/next.config.js ./
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

# Mudar para usuário não-root
USER nextjs

# Expor porta
EXPOSE 3000

# Comando para iniciar a aplicação
CMD ["npm", "start"] 