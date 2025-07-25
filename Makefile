# Makefile para automação do projeto Vehicle Tracking

.PHONY: help dev prod build clean logs test install

# Configurações
DOCKER_COMPOSE_DEV = docker-compose -f docker-compose.dev.yml
DOCKER_COMPOSE_PROD = docker-compose -f docker-compose.yml

help: ## Mostra esta ajuda
	@echo "Comandos disponíveis:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

install: ## Instala dependências
	@echo "Instalando dependências..."
	npm install
	cd tracker-server && npm install

dev: ## Inicia ambiente de desenvolvimento com hot reload
	@echo "Iniciando ambiente de desenvolvimento..."
	$(DOCKER_COMPOSE_DEV) up --build

dev-detached: ## Inicia ambiente de desenvolvimento em background
	@echo "Iniciando ambiente de desenvolvimento em background..."
	$(DOCKER_COMPOSE_DEV) up --build -d

dev-logs: ## Mostra logs do ambiente de desenvolvimento
	$(DOCKER_COMPOSE_DEV) logs -f

dev-stop: ## Para ambiente de desenvolvimento
	$(DOCKER_COMPOSE_DEV) down

prod: ## Inicia ambiente de produção
	@echo "Iniciando ambiente de produção..."
	$(DOCKER_COMPOSE_PROD) up --build

prod-detached: ## Inicia ambiente de produção em background
	@echo "Iniciando ambiente de produção em background..."
	$(DOCKER_COMPOSE_PROD) up --build -d

prod-logs: ## Mostra logs do ambiente de produção
	$(DOCKER_COMPOSE_PROD) logs -f

prod-stop: ## Para ambiente de produção
	$(DOCKER_COMPOSE_PROD) down

build: ## Constrói imagens sem cache
	@echo "Construindo imagens sem cache..."
	$(DOCKER_COMPOSE_PROD) build --no-cache --parallel

build-dev: ## Constrói imagens de desenvolvimento sem cache
	@echo "Construindo imagens de desenvolvimento sem cache..."
	$(DOCKER_COMPOSE_DEV) build --no-cache --parallel

clean: ## Remove containers, volumes e imagens não utilizadas
	@echo "Limpando containers e volumes..."
	docker system prune -f
	docker volume prune -f
	docker image prune -f

clean-all: ## Remove TUDO (containers, volumes, imagens, cache)
	@echo "Limpando TUDO..."
	docker system prune -af
	docker volume prune -f
	docker builder prune -af

logs: ## Mostra logs de todos os serviços
	$(DOCKER_COMPOSE_PROD) logs -f

logs-app: ## Mostra logs apenas da aplicação
	$(DOCKER_COMPOSE_PROD) logs -f app

logs-tracker: ## Mostra logs apenas do tracker server
	$(DOCKER_COMPOSE_PROD) logs -f tracker-server

test: ## Executa testes
	@echo "Executando testes..."
	npm test

test-build: ## Testa se o build funciona localmente
	@echo "Testando build local..."
	npm run build

restart: ## Reinicia todos os serviços
	$(DOCKER_COMPOSE_PROD) restart

restart-app: ## Reinicia apenas a aplicação
	$(DOCKER_COMPOSE_PROD) restart app

restart-tracker: ## Reinicia apenas o tracker server
	$(DOCKER_COMPOSE_PROD) restart tracker-server

status: ## Mostra status dos containers
	docker ps -a --filter "name=yukz"

shell-app: ## Acessa shell da aplicação
	docker exec -it yukz-app sh

shell-tracker: ## Acessa shell do tracker server
	docker exec -it yukz-tracker-server sh

# Comandos de desenvolvimento rápido
quick-dev: dev-stop dev-detached ## Para e reinicia desenvolvimento rapidamente

quick-prod: prod-stop prod-detached ## Para e reinicia produção rapidamente

# Comandos de debug
debug-app: ## Debug da aplicação
	$(DOCKER_COMPOSE_DEV) exec app npm run dev

debug-tracker: ## Debug do tracker server
	$(DOCKER_COMPOSE_DEV) exec tracker-server npm run dev

# Comandos de cache
cache-clear: ## Limpa cache do npm
	npm cache clean --force
	cd tracker-server && npm cache clean --force

# Comandos de monitoramento
monitor: ## Monitora recursos dos containers
	docker stats yukz-app yukz-tracker-server

# Comandos de backup
backup-volumes: ## Faz backup dos volumes
	@echo "Fazendo backup dos volumes..."
	docker run --rm -v yukz_npm-cache:/data -v $(PWD):/backup alpine tar czf /backup/npm-cache-backup.tar.gz -C /data .
	docker run --rm -v yukz_nextjs-cache:/data -v $(PWD):/backup alpine tar czf /backup/nextjs-cache-backup.tar.gz -C /data .