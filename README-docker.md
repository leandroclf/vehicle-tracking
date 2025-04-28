# Instruções para Implantação com Docker

## Visão Geral

Este documento fornece instruções para implantar o sistema de rastreamento veicular Yukz usando Docker. O sistema foi projetado para ser facilmente implantado em qualquer ambiente que suporte Docker.

## Pré-requisitos

- Docker instalado no servidor de implantação
- Credenciais do Supabase configuradas
- Chave de API do Google Maps (para funcionalidades de mapa)

## Arquivos Importantes

### Dockerfile
O Dockerfile foi configurado para construir a aplicação em dois estágios:
1. **Estágio de Build**: Compila a aplicação Next.js
2. **Estágio de Runtime**: Executa a aplicação compilada

### requirements.txt
Este arquivo lista todas as dependências necessárias para o sistema, incluindo:
- Supabase para banco de dados e autenticação
- Google Maps API para funcionalidades de mapa
- Bibliotecas de UI e componentes
- Ferramentas de autenticação e segurança

## Variáveis de Ambiente

As seguintes variáveis de ambiente precisam ser configuradas:

```
GOOGLE_MAPS_API_KEY="SUA_CHAVE_API_GOOGLE_MAPS"
SUPABASE_URL="SUA_URL_SUPABASE"
SUPABASE_ANON_KEY="SUA_CHAVE_ANON_SUPABASE"
JWT_SECRET="SUA_CHAVE_SECRETA_JWT"
SUPABASE_SERVICE_ROLE_KEY="SUA_CHAVE_SERVIÇO_SUPABASE"
```

## Instruções de Implantação

1. **Construir a imagem Docker**:
   ```bash
   docker build -t yukz-vehicle-tracking .
   ```

2. **Executar o contêiner**:
   ```bash
   docker run -p 3000:3000 \
     -e GOOGLE_MAPS_API_KEY="SUA_CHAVE_API_GOOGLE_MAPS" \
     -e SUPABASE_URL="SUA_URL_SUPABASE" \
     -e SUPABASE_ANON_KEY="SUA_CHAVE_ANON_SUPABASE" \
     -e JWT_SECRET="SUA_CHAVE_SECRETA_JWT" \
     -e SUPABASE_SERVICE_KEY="SUA_CHAVE_SERVIÇO_SUPABASE" \
     yukz-vehicle-tracking
   ```

3. **Acessar a aplicação**:
   Abra um navegador e acesse `http://localhost:3000`

## Solução de Problemas

- **Erro de dependências**: Verifique se todas as dependências estão listadas corretamente no arquivo requirements.txt
- **Erro de conexão com Supabase**: Verifique se as credenciais do Supabase estão configuradas corretamente
- **Erro de mapa não carregando**: Verifique se a chave de API do Google Maps está configurada corretamente