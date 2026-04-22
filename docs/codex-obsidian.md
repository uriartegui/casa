# Codex com Obsidian

Este projeto agora tem um fluxo local para usar o Obsidian com o Codex sem mexer no Claude.

## O que foi adicionado

- `AGENTS.md` com a regra do projeto para ler e atualizar a nota do Obsidian
- `scripts/obsidian/read_obsidian_context.py` para ler a nota do projeto
- `scripts/obsidian/update_obsidian_note.py` para manter um bloco automatico da ultima sessao
- `scripts/start-codex-obsidian.ps1` para abrir o Codex ja com o vault como diretorio adicional gravavel e atualizar a nota automaticamente ao sair

## Vault e nota esperados

- Vault padrao: `C:\dev\claude-brain`
- Nota do projeto atual: `C:\dev\claude-brain\Projetos\casa.md`

## Como usar

No PowerShell, na raiz do repo:

```powershell
.\scripts\start-codex-obsidian.ps1
```

Voce tambem pode passar o prompt inicial:

```powershell
.\scripts\start-codex-obsidian.ps1 "corrigir bug no login"
```

Se quiser testar manualmente os scripts:

```powershell
python .\scripts\obsidian\read_obsidian_context.py
python .\scripts\obsidian\update_obsidian_note.py --summary "Teste de sincronizacao" --files "none"
```

## Limite importante

O Codex CLI, pelo que esta instalacao expoe localmente, nao mostra um sistema nativo de hooks como o Claude Code. Entao o caminho mais confiavel aqui e:

- abrir o Codex pelo iniciador `start-codex-obsidian.ps1`
- deixar `AGENTS.md` reforcando a leitura e atualizacao da nota
- deixar o proprio iniciador escrever automaticamente um resumo factual ao encerrar a sessao

Isso aproxima bastante o comportamento do Claude, mas nao e o mesmo modelo de hooks por evento.
