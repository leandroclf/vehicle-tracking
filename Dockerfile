# syntax=docker/dockerfile:1.4

# Estágio base com dependências comuns
FROM node:20-alpine AS base

# Instalar dependências do sistema
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Configurar npm para cache otimizado
RUN npm config set cache /tmp/.npm --global

# Estágio de dependências
FROM base AS deps

# Copiar apenas arquivos de dependências para cache otimizado
COPY package.json package-lock.json ./

# Instalar dependências com cache mount
RUN --mount=type=cache,target=/tmp/.npm \
    npm ci --only=production --ignore-scripts && \
    npm cache clean --force

# Instalar dependências de desenvolvimento em layer separada
FROM base AS deps-dev

COPY package.json package-lock.json ./

RUN --mount=type=cache,target=/tmp/.npm \
    npm ci --ignore-scripts && \
    npm cache clean --force

# Estágio de build
FROM deps-dev AS builder

# Definir variáveis de ambiente para build
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
ARG JWT_SECRET

ENV NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
ENV NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=${NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
ENV JWT_SECRET=${JWT_SECRET}
ENV SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
ENV SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}

# Copiar código-fonte
COPY . .

# Build com cache mount para Next.js
RUN --mount=type=cache,target=/app/.next/cache \
    DISABLE_ESLINT_PLUGIN=true npm run build

# Estágio de desenvolvimento (para docker-compose.dev.yml)
FROM deps-dev AS development

ENV NODE_ENV=development
ENV PORT=3000

# Copiar código-fonte
COPY . .

EXPOSE 3000

# Comando para desenvolvimento com hot reload
CMD ["npm", "run", "dev"]

# Estágio de produção
FROM base AS production

WORKDIR /app

# Criar usuário não-root
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Definir variáveis de ambiente para runtime
ENV NODE_ENV=production
ENV PORT=3000

# Copiar dependências de produção
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules

# Copiar arquivos necessários do build
COPY --from=builder --chown=nextjs:nodejs /app/next.config.js ./
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

# Copiar build do Next.js
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next

# Configurar permissões
RUN chown -R nextjs:nodejs /app

# Mudar para usuário não-root
USER nextjs

EXPOSE 3000

# Comando para produção
CMD ["npm", "start"]

# Target padrão
FROM production AS default