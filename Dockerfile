# Estágio de build
FROM node:18-alpine AS builder

# Definir variáveis de ambiente para build
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
ARG JWT_SECRET

# Definir variáveis de ambiente públicas
ENV NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
ENV NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=${NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
ENV JWT_SECRET=${JWT_SECRET}
ENV SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
ENV SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}

WORKDIR /app

# Copiar arquivos de configuração e dependências
COPY package.json package-lock.json ./

# Instalar TODAS as dependências (incluindo devDependencies necessárias para o build)
RUN npm install && \
    npm cache clean --force

# Copiar o restante do código-fonte
COPY . .

# Gerar build de produção com ESLint ignorado
RUN DISABLE_ESLINT_PLUGIN=true npm run build

# Estágio de execução
FROM node:18-alpine AS runner

WORKDIR /app

# Criar usuário não-root
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Definir variáveis de ambiente para runtime
ENV NODE_ENV=production
ENV PORT=3000

# Copiar arquivos necessários do estágio de build
COPY --from=builder --chown=nextjs:nodejs /app/next.config.js ./
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/package-lock.json ./package-lock.json

# Instalar apenas dependências de produção no estágio de execução
RUN npm install --production && \
    npm cache clean --force

# Copiar build do Next.js
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next

# Configurar permissões corretas para diretórios
RUN mkdir -p /app/.next && \
    chown -R nextjs:nodejs /app

# Mudar para usuário não-root
USER nextjs

# Expor porta
EXPOSE 3000

# Comando para iniciar a aplicação
CMD ["npm", "start"]