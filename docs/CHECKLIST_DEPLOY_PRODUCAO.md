# Checklist de Deploy para Produção - Yukz MVP

## Resumo Executivo
Este checklist garante que o MVP do Yukz seja deployado com segurança e qualidade em ambiente de produção.

## 1. Pré-Deploy - Validações Técnicas

### 1.1 Testes e Qualidade
- [ ] Executar todos os testes unitários (`npm test`)
- [ ] Executar testes de integração
- [ ] Verificar cobertura de testes (mínimo 70%)
- [ ] Executar linting (`npm run lint`)
- [ ] Verificar build de produção (`npm run build`)
- [ ] Testar aplicação em modo produção localmente

### 1.2 Segurança
- [ ] Verificar se não há credenciais hardcoded no código
- [ ] Validar configuração de variáveis de ambiente
- [ ] Verificar políticas RLS no Supabase
- [ ] Testar autenticação MFA em ambiente de staging
- [ ] Validar CORS e CSP headers
- [ ] Verificar rate limiting nas APIs

### 1.3 Performance
- [ ] Otimizar imagens e assets estáticos
- [ ] Verificar bundle size (`npm run analyze`)
- [ ] Testar carregamento em conexões lentas
- [ ] Validar lazy loading de componentes
- [ ] Verificar cache de APIs

## 2. Configuração de Ambiente

### 2.1 Variáveis de Ambiente Produção
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key]
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]

# Autenticação
NEXTAUTH_SECRET=[random-secret-32-chars]
NEXTAUTH_URL=https://yukz.com.br

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=[maps-api-key]

# SMS/Email
TWILIO_ACCOUNT_SID=[twilio-sid]
TWILIO_AUTH_TOKEN=[twilio-token]
SENDGRID_API_KEY=[sendgrid-key]

# Monitoramento
SENTRY_DSN=[sentry-dsn]
```

### 2.2 Configuração Supabase Produção
- [ ] Criar projeto Supabase de produção
- [ ] Executar migrações SQL:
  - [ ] `unified_schema.sql`
  - [ ] `20240101_add_vehicle_commands.sql`
  - [ ] `20240102_add_social_auth.sql`
  - [ ] `20240103_add_mfa_support.sql`
- [ ] Configurar autenticação social (Google, Facebook, Apple)
- [ ] Configurar SMS provider (Twilio)
- [ ] Configurar email templates
- [ ] Ativar RLS em todas as tabelas

### 2.3 Configuração DNS e SSL
- [ ] Configurar domínio yukz.com.br
- [ ] Configurar SSL/TLS (Let's Encrypt ou Cloudflare)
- [ ] Configurar CDN (Cloudflare)
- [ ] Configurar redirects HTTP → HTTPS

## 3. Deploy da Aplicação

### 3.1 Vercel (Recomendado)
```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Configurar variáveis de ambiente no dashboard Vercel
```

### 3.2 Configurações Vercel
- [ ] Configurar variáveis de ambiente
- [ ] Configurar domínio customizado
- [ ] Ativar analytics
- [ ] Configurar redirects e rewrites
- [ ] Ativar Edge Functions se necessário

### 3.3 Alternativa Docker
```bash
# Build da imagem
docker build -t yukz-app .

# Deploy no servidor
docker run -d -p 3000:3000 --env-file .env.production yukz-app
```

## 4. Configuração de Monitoramento

### 4.1 Sentry (Error Tracking)
- [ ] Configurar projeto Sentry
- [ ] Adicionar DSN nas variáveis de ambiente
- [ ] Testar captura de erros
- [ ] Configurar alertas por email/Slack

### 4.2 Analytics
- [ ] Configurar Google Analytics 4
- [ ] Configurar Vercel Analytics
- [ ] Implementar tracking de eventos críticos:
  - [ ] Login/Logout
  - [ ] Comandos enviados para veículos
  - [ ] Configuração MFA
  - [ ] Erros de autenticação

### 4.3 Uptime Monitoring
- [ ] Configurar UptimeRobot ou similar
- [ ] Monitorar endpoints críticos:
  - [ ] `/api/health`
  - [ ] `/api/auth/session`
  - [ ] `/api/vehicles`
- [ ] Configurar alertas para downtime

## 5. Testes Pós-Deploy

### 5.1 Smoke Tests
- [ ] Página inicial carrega corretamente
- [ ] Login com email/senha funciona
- [ ] Login social (Google) funciona
- [ ] Dashboard carrega dados dos veículos
- [ ] Mapa exibe localização dos veículos
- [ ] Comandos remotos funcionam
- [ ] MFA pode ser configurado
- [ ] Autenticação por telefone funciona

### 5.2 Testes de Performance
- [ ] Lighthouse Score > 90
- [ ] First Contentful Paint < 2s
- [ ] Time to Interactive < 3s
- [ ] Cumulative Layout Shift < 0.1

### 5.3 Testes de Segurança
- [ ] Testar tentativas de acesso não autorizado
- [ ] Verificar headers de segurança
- [ ] Testar rate limiting
- [ ] Verificar sanitização de inputs

## 6. Documentação e Comunicação

### 6.1 Documentação Técnica
- [ ] Atualizar README.md
- [ ] Documentar APIs no Swagger
- [ ] Criar guia de troubleshooting
- [ ] Documentar processo de backup

### 6.2 Comunicação com Stakeholders
- [ ] Notificar equipe sobre deploy
- [ ] Enviar relatório de status
- [ ] Agendar treinamento para usuários
- [ ] Preparar material de suporte

## 7. Backup e Recuperação

### 7.1 Backup de Dados
- [ ] Configurar backup automático do Supabase
- [ ] Testar processo de restore
- [ ] Documentar procedimentos de recuperação

### 7.2 Rollback Plan
- [ ] Manter versão anterior disponível
- [ ] Documentar processo de rollback
- [ ] Testar rollback em staging

## 8. Pós-Deploy - Monitoramento Inicial

### 8.1 Primeiras 24h
- [ ] Monitorar logs de erro
- [ ] Verificar métricas de performance
- [ ] Acompanhar feedback dos usuários
- [ ] Verificar uso de recursos (CPU, memória)

### 8.2 Primeira Semana
- [ ] Analisar padrões de uso
- [ ] Identificar gargalos de performance
- [ ] Coletar feedback dos usuários
- [ ] Planejar otimizações

## 9. Checklist de Aprovação Final

### Aprovações Necessárias
- [ ] **Técnico Lead**: Validação técnica completa
- [ ] **QA**: Testes de qualidade aprovados
- [ ] **Segurança**: Auditoria de segurança aprovada
- [ ] **Product Owner**: Funcionalidades validadas
- [ ] **DevOps**: Infraestrutura configurada

### Critérios de Go-Live
- [ ] Todos os testes passando
- [ ] Performance dentro dos SLAs
- [ ] Monitoramento ativo
- [ ] Equipe de suporte preparada
- [ ] Plano de rollback testado

---

## Comandos Úteis

```bash
# Verificar saúde da aplicação
curl https://yukz.com.br/api/health

# Monitorar logs em tempo real
vercel logs --follow

# Verificar status do build
vercel inspect [deployment-url]

# Executar testes localmente
npm test
npm run test:integration
npm run lint
npm run build
```

## Contatos de Emergência

- **DevOps**: [email/telefone]
- **Supabase Support**: support@supabase.io
- **Vercel Support**: support@vercel.com
- **DNS Provider**: [contato do provedor]

---

**Data de Criação**: 2024-01-03  
**Versão**: 1.0  
**Responsável**: Equipe Yukz  
**Próxima Revisão**: Após primeiro deploy