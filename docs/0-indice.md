# Documentação do Sistema Yukz - Rastreamento Veicular

## Índice

1. [Visão Geral do Sistema](1-visao-geral.md)
   - 1.1 Propósito e Objetivos
   - 1.2 Contexto e Problemas Resolvidos
   - 1.3 Público-Alvo
   - 1.4 Diferenciais Competitivos

2. [Arquitetura do Sistema](2-arquitetura.md)
   - 2.1 Visão Geral da Arquitetura
   - 2.2 Componentes Principais
   - 2.3 Fluxos de Dados Principais
   - 2.4 Infraestrutura e Deploy

3. [Módulos e Responsabilidades](3-modulos.md)
   - 3.1 Módulo de Autenticação
   - 3.2 Módulo de Veículos
   - 3.3 Módulo de Mapa
   - 3.4 Módulo de Geocercas
   - 3.5 Módulo de Alertas
   - 3.6 Módulo de Relatórios
   - 3.7 Módulo de Configurações
   - 3.8 Módulo de UI
   - 3.9 Tracker Server

4. [Dependências e Configuração](4-dependencias.md)
   - 4.1 Bibliotecas e Frameworks
   - 4.2 Variáveis de Ambiente
   - 4.3 Passos de Instalação
   - 4.4 Banco de Dados

5. [API e Endpoints](5-api.md)
   - 5.1 Convenções da API
   - 5.2 Autenticação
   - 5.3 Veículos
   - 5.4 Geocercas
   - 5.5 Alertas
   - 5.6 Configurações
   - 5.7 Histórico de Posições
   - 5.8 Relatórios

6. [Instalação e Execução](6-instalacao.md)
   - 6.1 Requisitos do Sistema
   - 6.2 Instalação do Ambiente de Desenvolvimento
   - 6.3 Configuração do Ambiente
   - 6.4 Execução do Sistema
   - 6.5 Implantação com Docker
   - 6.6 Acessando a Aplicação
   - 6.7 Testes
   - 6.8 Solução de Problemas
   - 6.9 [Deploy com Docker (Detalhado)](docker-deployment.md)

7. [Referências e Recursos](7-referencias.md)
   - 7.1 Documentação Oficial das Tecnologias
   - 7.2 Protocolos de Rastreamento
   - 7.3 Padrões de Design Adotados
   - 7.4 Bibliotecas e Utilitários Principais
   - 7.5 Tutoriais e Recursos de Aprendizado
   - 7.6 Comunidade e Suporte
   - 7.7 Ferramentas Recomendadas

## Documentos Adicionais

- [Estrutura do Banco de Dados](estrutura-banco-dados.md) - Detalhamento das tabelas e relações
- [Guia do Usuário](guia-do-usuario.md) - Manual de uso do sistema
- [Tarefas Pendentes de Documentação](TODO.md) - Lista de melhorias planejadas para a documentação
- [Acesso para Teste](acesso-teste.md) - Credenciais e instruções para ambiente de teste
- [Performance do Frontend](performance-frontend.md) - Diretrizes e métricas de desempenho
- [Configuração do Supabase](supabase-setup.md) - Setup do ambiente Supabase

## Versão da Documentação

**Versão:** 1.0.0  
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