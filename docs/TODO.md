# Tarefas de Desenvolvimento – Yukz

Este documento lista as tarefas planejadas para o desenvolvimento e melhoria do sistema Yukz de rastreamento veicular, organizadas por prioridade e dependências.

## Tarefas de Desenvolvimento Sequenciais

### 1. Integração e Dados em Tempo Real
1. **✔ Substituir dados simulados por dados reais** – Prioridade: Alta  
   - ✔ Conectar frontend com dados reais do Supabase  
   - ✔ Implementar polling ou Supabase Realtime para atualizações em tempo real  
   - ✔ Adaptar componentes para lidar com dados reais  
   - ✔ Dependências: Servidor de rastreamento funcionando  

2. **✔ Implementar visualização de geocercas no mapa** – Prioridade: Média  
   - ✔ Desenvolver renderização de geocercas circulares e poligonais  
   - ✔ Adicionar ferramentas de desenho para criação/edição de geocercas  
   - ✔ Implementar lógica de detecção de entrada/saída  
   - ✔ Dependências: Integração com dados reais  

3. **✔ Desenvolver sistema de commands para veículos** – Prioridade: Média  
   - ✔ Implementar interface para envio de comandos (bloquear/desbloquear motor)  
   - ✔ Criar sistema de fila e confirmação de comandos  
   - ✔ Implementar histórico de comandos enviados  
   - ✔ Dependências: Integração com dados reais  

### 2. Melhorias de Experiência do Usuário
4. **✔ Aprimorar interface do dashboard** – Prioridade: Média  
   - ✔ Redesenhar dashboard principal com widgets configuráveis  
   - ✔ Implementar temas claro/escuro consistentes  
   - ✔ Adicionar visualizações de dados em tempo real  
   - ✔ Dependências: Nenhuma  

5. **✔ Melhorar sistema de relatórios** – Prioridade: Média  
   - ✔ Implementar relatórios customizáveis  
   - ✔ Adicionar novos tipos de relatórios (consumo, comportamento, eficiência)  
   - ✔ Permitir agendamento de relatórios periódicos  
   - ✔ Dependências: Integração com dados reais  

### 3. Melhorias no Servidor de Rastreamento
6. **✔ Implementar protocolos adicionais para rastreadores** – Prioridade: Alta  
   - ✔ Adicionar suporte para protocolo Queclink  
   - ✔ Adicionar suporte para protocolo Concox  
   - ✔ Melhorar o decodificador Teltonika existente  
   - ✔ Dependências: Conhecimento da documentação dos protocolos  

7. **✔ Implementar servidor UDP no tracker-server** – Prioridade: Alta  
   - ✔ Criar servidor UDP paralelo ao TCP existente  
   - ✔ Compartilhar lógica de processamento entre servidores TCP/UDP  
   - ✔ Implementar tratamento de pacotes UDP específicos  
   - ✔ Dependências: Configuração de porta UDP no arquivo `.env`  

8. **Desenvolver lógica de alertas no tracker-server** – Prioridade: Média  
   - Implementar detecção de excesso de velocidade  
   - Implementar verificação de entrada/saída de geocercas  
   - Criar sistema de notificação em tempo real para alertas  
   - Dependências: Implementação completa do servidor TCP/UDP  

### 4. Aplicativo Móvel
9. ✔**Desenvolver aplicativo móvel** – Prioridade: Baixa  
   ✔- Criar versão mobile da aplicação (React Native)  
   ✔- Implementar notificações push para alertas  
   ✔- Adaptar interface para uso móvel  
   ✔- Dependências: API estável e sistema de alertas funcionando  

### 5. DevOps e Infraestrutura
10. ✔**Criar Dockerfile para o tracker-server** – Prioridade: Alta  
    ✔- Desenvolver Dockerfile otimizado com multi-stage build  
    ✔- Implementar healthchecks e configurações de segurança  
    ✔- Documentar variáveis de ambiente necessárias  
    ✔- Dependências: Servidor de rastreamento funcionando  

11. ✔**Configurar docker-compose completo** – Prioridade: Alta  
    ✔- Criar `docker-compose.yml` com todos os serviços  
    ✔- Configurar rede interna entre containers  
    ✔- Implementar volumes para persistência de dados  
    ✔- Dependências: Dockerfile para tracker-server  

12. ✔**Implementar testes automatizados** – Prioridade: Média  
    ✔- Desenvolver testes unitários para componentes principais  
    ✔- Implementar testes de integração para fluxos críticos  
    ✔- Configurar CI/CD para execução automática de testes  
    ✔- Dependências: Nenhuma  

13. ✔**Melhorar segurança e desempenho** – Prioridade: Média  
    ✔- Realizar auditoria de segurança completa  
    ✔- Otimizar queries ao banco de dados  
    ✔- Implementar cache para dados frequentemente acessados  
    ✔- Dependências: Sistema base funcionando  

---

## Priorização e Estimativas

### Prioridade Alta (Implementar primeiro)
- ✔ Substituir dados simulados por dados reais (1–2 semanas)  
- ✔ Implementar protocolos adicionais para rastreadores (2–3 semanas)  
- ✔ Implementar servidor UDP no tracker-server (1 semana)  
- ✔ Criar Dockerfile para o tracker-server (3–5 dias)  
- ✔ Configurar docker-compose completo (3–5 dias)  

### Prioridade Média (Segunda fase)
- ✔ Implementar visualização de geocercas no mapa (1–2 semanas)  
- ✔ Desenvolver sistema de commands para veículos (1–2 semanas)  
- ✔ Aprimorar interface do dashboard (2–3 semanas)  
- ✔ Melhorar sistema de relatórios (2–3 semanas)  
- Desenvolver lógica de alertas no tracker-server (1–2 semanas)  
- ✔ Implementar testes automatizados (contínuo)  
- ✔ Melhorar segurança e desempenho (contínuo)  

### Prioridade Baixa (Fase final)
- ✔ Desenvolver aplicativo móvel (1–2 meses)
