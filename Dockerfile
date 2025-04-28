# Dockerfile para Aplicação Next.js Yukz

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

# Garante que todas as dependências listadas em requirements.txt estejam instaladas
# Isso inclui Supabase, Google Maps API e outras bibliotecas essenciais
RUN cat requirements.txt | grep -v "^#" | grep "@" | xargs -I {} npm install {} --legacy-peer-deps

# Define todas as variáveis de ambiente necessárias para build
ENV NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="YOUR_GOOGLE_MAPS_API_KEY_HERE"
ENV NEXT_PUBLIC_SUPABASE_URL="YOUR_SUPABASE_URL_HERE"
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY_HERE"
ENV JWT_SECRET="YOUR_JWT_SECRET_KEY_HERE"
ENV SUPABASE_SERVICE_ROLE_KEY="YOUR_SUPABASE_SERVICE_ROLE_KEY_HERE"

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

# Define todas as variáveis de ambiente necessárias para execução
ENV NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="YOUR_GOOGLE_MAPS_API_KEY_HERE"
ENV NEXT_PUBLIC_SUPABASE_URL="YOUR_SUPABASE_URL_HERE"
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY_HERE"
ENV JWT_SECRET="YOUR_JWT_SECRET_KEY_HERE"
ENV SUPABASE_SERVICE_ROLE_KEY="YOUR_SUPABASE_SERVICE_ROLE_KEY_HERE"

# Copia os artefatos de build do estágio anterior
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Expõe a porta que o Next.js usa (padrão 3000)
EXPOSE 3000

# Define o comando para iniciar a aplicação
CMD ["npm", "start"]

