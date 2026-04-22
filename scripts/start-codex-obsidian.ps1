param(
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$PromptParts
)

function Get-ChangedFiles {
  $statusLines = git status --porcelain 2>$null
  if (-not $statusLines) {
    return @()
  }

  $files = @()
  foreach ($line in $statusLines) {
    if ($line.Length -lt 4) {
      continue
    }

    $pathText = $line.Substring(3).Trim()
    if ($pathText -like '* -> *') {
      $pathText = ($pathText -split ' -> ')[-1]
    }

    if ($pathText) {
      $files += $pathText
    }
  }

  return $files | Sort-Object -Unique
}

$vault = if ($env:OBSIDIAN_VAULT) { $env:OBSIDIAN_VAULT } else { 'C:\dev\claude-brain' }
$project = Split-Path -Leaf (Get-Location)
$notePath = Join-Path $vault "Projetos\$project.md"
$userPrompt = ($PromptParts -join ' ').Trim()
$changedBefore = Get-ChangedFiles

$context = ""
if (Test-Path $notePath) {
  $context = Get-Content $notePath -Raw -Encoding UTF8
}

$prompt = @"
Leia e internalize o contexto de Obsidian abaixo antes de agir.
Antes de trabalho substantivo, considere a nota do projeto como memoria ativa.
Ao concluir cada tarefa relevante, atualize a nota do projeto executando:
python .\scripts\obsidian\update_obsidian_note.py --summary "<resumo curto>" --files "<arquivos alterados ou none>"

[Obsidian - $project]
$context
"@

if ($userPrompt) {
  $prompt = $prompt.TrimEnd() + "`n`n[Pedido do usuario]`n" + $userPrompt
}

codex --add-dir $vault $prompt
$exitCode = $LASTEXITCODE

$changedAfter = Get-ChangedFiles
$newOrCurrentFiles = @($changedAfter)
if (-not $newOrCurrentFiles -or $newOrCurrentFiles.Count -eq 0) {
  $filesText = "none"
  $summary = "Sessao encerrada sem arquivos modificados detectados pelo git."
} else {
  $filesText = ($newOrCurrentFiles -join ", ")
  $summary = "Sessao encerrada automaticamente. Arquivos modificados detectados pelo git."
}

python .\scripts\obsidian\update_obsidian_note.py --summary $summary --files $filesText | Out-Null

exit $exitCode
