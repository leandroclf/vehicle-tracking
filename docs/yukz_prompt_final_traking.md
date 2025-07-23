# Prompt Ultra-Detalhado para Aplicativo Yukz – Liderança de Mercado

## Introdução

**Objetivo:** Criar o aplicativo de rastreamento veicular Yukz com metas quantitativas claras, como alcançar 100 mil usuários ativos no primeiro ano e faturamento inicial esperado de R$ 1 milhão, visando liderança absoluta no mercado brasileiro e expansão estratégica pela América Latina.

## Público-Alvo
- Pessoas físicas (uso pessoal).
- Pequenas empresas (2 a 20 veículos).
- Grandes corporações com grandes frotas (20 a milhares de veículos).
- Variedade de veículos: carros, motos, caminhões, embarcações (lanchas e jet skis).

## Visão do Produto
- Plataforma robusta, intuitiva e de alta performance.
- Arquitetura escalável, pronta para internacionalização.
- Experiência UX/UI premium com elementos específicos: navegação intuitiva, feedback imediato e interação fluida comparáveis a líderes como Uber, Tesla e Waze.

## Funcionalidades Detalhadas

### MVP (Obrigatórias)
- Autenticação (e-mail, telefone, recuperação de senha, login social).
- Cadastro de veículos e dispositivos (IMEI/ID).
- Rastreamento ao vivo em mapa.
- Telemetria em tempo real (velocidade, ignição, direção, satélites, bateria).
- Notificações essenciais (ignição, movimento, pânico, desconexão).
- Histórico diário de trajetos (replay).
- Relatórios simples (distância, tempo, velocidade).
- Comandos remotos de bloqueio/desbloqueio com dupla confirmação.
- Perfil do usuário editável.
- Configurações de notificações e aparência (tema claro/escuro).
- Multi-veículo em um único app.
- Segurança HTTPS + OAuth2/JWT.
- Atualizações em tempo real efetivo (≤ 30s) usando WebSockets ou Realtime APIs.
- Reconexão automática após perda de rede.

### Versão 2.0 (Desejáveis)
- Dashboard detalhado para gestão de frotas com métricas claras: consumo médio, tempo médio em movimento, alertas críticos, eficiência operacional.
- Cercas virtuais (Geofences).
- Histórico avançado e replay interativo.
- Relatórios avançados em PDF/Excel.
- Comandos remotos adicionais (sirene, faróis).
- Gestão de manutenções preventivas.
- Alertas customizáveis.
- Compartilhamento temporário por link.
- Modo Valet.
- Suporte multilíngue (PT, EN, ES).
- Autenticação multifatorial (MFA).
- UX refinada com transições suaves e personalizações.

### Futuras (Inovações para Liderança)
- Score de condução para seguros inteligentes.
- Integração com assistentes digitais (Google Assistant, Alexa).
- Detecção automática de acidentes.
- Rastreamento indoor.
- Clustering inteligente em mapas.
- Manutenção preditiva via IA.
- Suporte parcial offline.
- Marketplace de serviços automotivos (manutenção, seguros, lavagem, abastecimento).
- Controle avançado de frota (motoristas, tarefas).
- Suporte a veículos elétricos/híbridos.

## Fluxo de Telas
- Login
- Dashboard principal
- Mapa em tempo real + Telemetria
- Detalhes do veículo
- Histórico de viagens
- Relatórios
- Perfil do usuário
- Configurações gerais

### Guidelines UX
- Carregamento instantâneo.
- Feedback imediato.
- Responsividade e navegação fluida.

## Arquitetura Técnica

### Frontend Mobile
- Clean Architecture
- MVVM
- Feature Modules

### Backend & Banco de Dados (Supabase)
- PostgreSQL gerenciado
- Autenticação e storage nativos
- Edge Functions serverless
- Row-Level Security (RLS)

### Comunicação
- API RESTful para CRUDs
- WebSocket/Realtime APIs para atualizações instantâneas

## Modelo MPC para Integrações
- Estrutura: Model, Provider, Connector
- Integração com APIs externas (Google Maps/OpenStreetMap)
- Objetivos: facilidade de troca, testes e independência

## Requisitos de Desempenho
- Atualização em tempo real ≤ 30s (via WebSockets/Realtime APIs).
- Pooling inteligente para baixo consumo de bateria.
- Otimização dos dados transmitidos.

## Segurança
- Comunicação HTTPS
- OAuth2/JWT para sessão
- Armazenamento seguro (Secure Storage)
- MFA para usuários sensíveis
- Criptografia ponta a ponta dos dados sensíveis
- Auditorias periódicas de segurança seguindo normas OWASP
- Row-Level Security no Supabase

## Testabilidade & Observabilidade
- Testes unitários (ex.: Jest para componentes isolados), testes de integração (ex.: supertest para APIs RESTful) e testes E2E (ex.: Cypress para simular jornadas completas do usuário), garantindo cobertura ampla e robusta desde a lógica básica até as interações completas do sistema.
- Logs estruturados para debug
- Monitoramento contínuo da performance

## Escalabilidade
- Preparação explícita para expansão massiva de veículos e usuários
- Modularização desacoplada com critérios claros: separação lógica por funcionalidades, interfaces bem definidas e uso de feature toggles.

## Publicação & Pós-Lançamento
- Conformidade com AppStore/Google Play
- LGPD e GDPR compliance
- Estratégia de feedback ágil pós-lançamento

## Branding & Estilo
- Logo e identidade visual consistente
- Paleta moderna (Azul Escuro, Cinza, Destaques Vibrantes)
- Comunicação clara e motivadora
- UX Writing simples e direto

## Banco de Dados (Supabase)

| Tabela       | Descrição                                    |
|--------------|----------------------------------------------|
| users        | Usuários e autenticação                      |
| vehicles     | Veículos associados ao usuário               |
| trackers     | Dispositivos de rastreamento                 |
| positions    | Localizações (lat, long, velocidade)         |
| events       | Eventos de rastreamento (ignição, pânico)    |
| fences       | Cercas virtuais                              |
| maintenance  | Registro de manutenções                      |
| reports      | Relatórios gerados                           |

## Checklist de Entrega

- [ ] MVP completo
- [ ] Supabase implementado
- [ ] Atualizações em tempo real ≤ 30s (estratégia técnica detalhada)
- [ ] Uso do MPC model
- [ ] Modelagem do banco correta
- [ ] Dashboard operacional
- [ ] Histórico e relatórios funcionais
- [ ] Aplicativo seguro (HTTPS + JWT + auditorias OWASP)
- [ ] UX fluido
- [ ] Publicação preparada

---

### Instrução para Desenvolvimento:
**Priorizar** qualidade de código, segurança, escalabilidade e UX excepcional, seguindo rigorosamente as especificações acima.

