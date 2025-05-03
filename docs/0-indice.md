# Índice da Documentação - Yukz

Esta documentação técnica abrangente fornece informações detalhadas sobre o sistema Yukz de rastreamento veicular, destinado a desenvolvedores, administradores e usuários técnicos.

## Visão Geral do Sistema

1. [Visão Geral do Sistema](1-visao-geral.md)
   - Propósito e Objetivos
   - Contexto e Problemas Resolvidos
   - Público-Alvo
   - Diferenciais Competitivos

## Especificações Técnicas

2. [Arquitetura do Sistema](2-arquitetura.md)
   - Visão Geral da Arquitetura
   - Componentes Principais
   - Fluxos de Dados
   - Infraestrutura e Deploy

3. [Módulos e Responsabilidades](3-modulos.md)
   - Módulo de Autenticação
   - Módulo de Veículos
   - Módulo de Mapa
   - Módulo de Geocercas
   - Módulo de Alertas
   - Módulo de Relatórios
   - Módulo de Configurações
   - Módulo de UI
   - Tracker Server

4. [Dependências e Configuração](4-dependencias.md)
   - Bibliotecas e Frameworks
   - Variáveis de Ambiente
   - Passos de Instalação
   - Banco de Dados

5. [API e Endpoints](5-api.md)
   - Convenções da API
   - Autenticação
   - Endpoints de Veículos
   - Endpoints de Geocercas
   - Endpoints de Alertas
   - Endpoints de Relatórios
   - Endpoints de Configurações

## Guias Operacionais

6. [Instalação e Execução](6-instalacao.md)
   - Requisitos do Sistema
   - Instalação do Ambiente de Desenvolvimento
   - Configuração do Ambiente
   - Execução do Sistema
   - Implantação com Docker

7. [Referências e Recursos](7-referencias.md)
   - Documentação Oficial das Tecnologias
   - Tutoriais e Artigos
   - Ferramentas Recomendadas
   - Comunidades e Suporte

## Tópicos Específicos

- [Estrutura do Banco de Dados](estrutura-banco-dados.md)
   - Tabelas Principais
   - Relações entre Tabelas
   - Políticas de Segurança (RLS)
   - Migrations

- [Integração com Supabase](supabase-integracao.md)
   - Configuração do Projeto Supabase
   - Autenticação
   - Banco de Dados
   - Storage
   - Realtime

- [Tracker Server](tracker-server.md)
   - Arquitetura do Servidor
   - Protocolos Suportados
   - Fluxo de Processamento de Dados
   - Configuração e Deployment

- [Mapa e Rastreamento](mapa-rastreamento.md)
   - Integração com Google Maps
   - Rastreamento em Tempo Real
   - Histórico de Rotas
   - Geocercas

- [Docker Deployment](docker-deployment.md)
   - Arquitetura Docker
   - Configuração de Containers
   - Networking e Volumes
   - CI/CD com Docker

- [Performance no Frontend](performance-frontend.md)
   - Otimizações de Renderização
   - Carregamento Assíncrono
   - Caching de Dados
   - Lazy Loading

- [Implementação de Gestão de Relatórios](implementacao_gestao_relatorios.md)
   - Geração de Relatórios
   - Exportação de Dados
   - Agendamento
   - Visualizações

- [Guia do Usuário](guia-do-usuario.md)
   - Instruções para Usuários Finais
   - Fluxos de Trabalho Comuns
   - Solução de Problemas

- [Supabase Setup](supabase-setup.md)
   - Configuração Inicial
   - Políticas de Segurança
   - Funções e Triggers
   - Backups e Manutenção

- [Acesso para Teste](acesso-teste.md)
   - Credenciais de Teste
   - Ambientes Disponíveis
   - Limitações de Teste

## Planejamento

- [Tarefas de Desenvolvimento](TODO.md)
   - Lista Priorizada de Tarefas
   - Estimativas e Dependências
   - Plano de Desenvolvimento

## Documentos Adicionais

- [Estrutura do Banco de Dados](estrutura-banco-dados.md) - Detalhamento das tabelas e relações
- [Guia do Usuário](guia-do-usuario.md) - Manual de uso do sistema
- [Tarefas Pendentes de Documentação](TODO.md) - Lista de melhorias planejadas para a documentação
- [Acesso para Teste](acesso-teste.md) - Credenciais e instruções para ambiente de teste
- [Performance do Frontend](performance-frontend.md) - Diretrizes e métricas de desempenho
- [Configuração do Supabase](supabase-setup.md) - Setup do ambiente Supabase
- [Mapa de Rastreamento](mapa-rastreamento.md) - Documentação detalhada do componente de mapa

## Componentes Detalhados

- [Servidor de Rastreamento](tracker-server.md) - Documentação do servidor de comunicação com dispositivos GPS
- [Mapa de Rastreamento](mapa-rastreamento.md) - Implementação e funcionalidades do mapa interativo
- [Integração com Supabase](supabase-integracao.md) - Detalhes sobre o uso do Supabase como backend

## Versão da Documentação

**Versão:** 1.1.0  
**Data:** Maio/2025  
**Autores:** Equipe Yukz

## Como Utilizar Esta Documentação

Esta documentação está organizada em seções lógicas, começando com uma visão geral conceitual e progredindo até detalhes técnicos específicos. Recomendamos as seguintes abordagens de leitura:

- **Para Desenvolvedores**: Comece pela Arquitetura do Sistema (2) e depois aprofunde-se em módulos específicos de interesse (3).
- **Para DevOps e SRE**: Foque na Instalação e Execução (6) e Arquitetura do Sistema (2).
- **Para Gerentes de Projeto**: Concentre-se na Visão Geral (1) e explore os módulos de alto nível (3).
- **Para Novos Membros da Equipe**: Leia sequencialmente todas as seções para obter uma compreensão completa do sistema.

## Convenções de Formatação

- `código inline` - Representa comandos, caminhos de arquivos ou trechos de código
- **Negrito** - Destaca conceitos importantes ou termos-chave
- *Itálico* - Usado para ênfase ou notas
- > Blocos de citação - Informações importantes ou avisos
- ```código em bloco``` - Exemplos de código, configurações ou comandos multi-linha 