# Glob: src/**

<!-- 
Este é um EXEMPLO de arquivo de regras. Delete este arquivo e crie os seus próprios.

Arquivos em .claude/rules/ são carregados automaticamente pelo Claude quando
os arquivos do projeto correspondem ao padrão Glob definido no topo.

Exemplo de regras para um projeto NestJS:
-->

## Padrões de código

- Sempre usar async/await, nunca callbacks
- Services só injetam outros services, não repositories diretamente
- DTOs validados com class-validator em toda entrada de dados
- Erros lançados como HttpException com mensagem em português

## Estrutura de módulos

Cada módulo deve ter: controller, service, dto/, entities/
