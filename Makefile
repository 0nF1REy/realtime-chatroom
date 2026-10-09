.DEFAULT_GOAL := help

.PHONY: help add status sync context send git-context

help: ## Mostra os comandos disponíveis
	@echo "Comandos disponíveis:"
	@grep -E '^[a-zA-Z\_-]+:.*?## ' $(MAKEFILE_LIST) | \
	awk 'BEGIN {FS = ":.*?## "}; {printf "  %-10s %s\n", $$1, $$2}'
	@echo ""

add: ## Adiciona todas as mudanças ao stage
	@git add .
	@echo "▐▓▒░ Todas as mudanças do repositório foram adicionadas ao stage."

status: ## Mostra o status atual do repositório
	@echo "▐▓▒░ Status atual do repositório:"
	@git status

sync: ## Sincroniza o repositório
	@echo "Buscando atualizações remotas (Pull)..."
	@git pull --rebase --autostash origin main
	@echo "Enviando atualizações locais (Push)..."
	@git push origin main
	@echo "Sincronização completa!"
	@echo ""
	@echo "▐▓▒░ Status atual do repositório:"
	@git status

context: ## Gera o arquivo context.txt com repomix
	@echo "Limpando vestígios anteriores..."
	@rm -f context.txt
	@echo "Gerando novo contexto..."
	@npx --yes repomix --output context.txt

send: context ## Copia o contexto para o clipboard e apaga o arquivo
	@echo "Copiando para o clipboard..."
	@if command -v xclip > /dev/null; then \
		cat context.txt | xclip -selection clipboard; \
		echo "Copiado para o clipboard!"; \
	else \
		echo "Erro: xclip não encontrado."; \
	fi
	@echo "Limpando arquivo de contexto para manter o diretório limpo..."
	@rm -f context.txt
	@echo "Pronto! O arquivo context.txt foi removido."

git-context: ## Gera contexto Git + Prompt AI para o clipboard
	@echo "### AI INSTRUCTIONS ###" > context.tmp
	@cat docs/ai/commit-prompt.txt >> context.tmp
	@echo "\n### GIT STATUS ###" >> context.tmp
	@git status --porcelain=1 -b >> context.tmp
	@echo "\n### GIT NAME-STATUS ###" >> context.tmp
	@git diff --cached --name-status >> context.tmp
	@echo "\n### GIT STAT ###" >> context.tmp
	@git diff --cached --stat >> context.tmp
	@echo "\n### GIT DIFF ###" >> context.tmp
	@git diff --cached >> context.tmp
	@echo "\n### GIT LOG ###" >> context.tmp
	@git log --oneline -n 20 >> context.tmp
	@cat context.tmp | xclip -selection clipboard
	@rm context.tmp
	@echo "▐▓▒░ Contexto e Instruções copiados com sucesso!"
