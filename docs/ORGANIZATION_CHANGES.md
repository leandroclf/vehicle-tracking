# Mudanças na Organização do Projeto

## Reorganização de Arquivos

Este documento registra as mudanças realizadas para melhorar a organização da estrutura do projeto.

### Arquivos Movidos

#### 1. `init-db.js` → `scripts/init-db.js`
- **Motivo**: Script de inicialização de banco de dados deve estar na pasta de scripts
- **Descrição**: Script utilitário para configuração inicial do Supabase e criação de usuários de teste
- **Localização anterior**: Raiz do projeto
- **Nova localização**: `scripts/init-db.js`

#### 2. `requirements.txt` → `config/requirements.txt`
- **Motivo**: Arquivo de referência de dependências, não um arquivo de configuração ativo
- **Descrição**: Lista das principais dependências do projeto para referência
- **Localização anterior**: Raiz do projeto
- **Nova localização**: `config/requirements.txt`
- **Nota**: Este arquivo serve apenas como documentação. A instalação real é feita via `package.json`

### Novas Pastas Criadas

#### `config/`
- **Finalidade**: Organizar arquivos de configuração e referência
- **Conteúdo**:
  - `requirements.txt` - Lista de dependências de referência
  - `README.md` - Documentação da pasta

### Arquivos Mantidos na Raiz

Os seguintes arquivos foram mantidos na raiz por serem essenciais ou seguirem convenções padrão:

- `wrangler.toml` - Configuração do Cloudflare Workers (padrão da ferramenta)
- `eslint.config.architecture.js` - Configuração específica da arquitetura (deve ser facilmente acessível)
- Arquivos de configuração padrão (`.babelrc`, `.eslintrc.json`, `next.config.js`, etc.)

## Benefícios da Reorganização

1. **Estrutura mais limpa**: Raiz do projeto com menos arquivos
2. **Melhor organização**: Scripts agrupados em `scripts/`, configurações em `config/`
3. **Facilita manutenção**: Arquivos relacionados estão próximos
4. **Segue convenções**: Estrutura mais próxima de padrões da comunidade

## Data da Reorganização

" + new Date().toISOString().split('T')[0] + "