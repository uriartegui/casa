# Codex + Obsidian Workflow

For every task in this repository, follow this workflow before doing substantive work:

1. Read the project note from Obsidian by running:
   `python .\scripts\obsidian\read_obsidian_context.py`
2. Use that note as project context together with the repository contents.
3. After completing the task, update the Codex session block in the same Obsidian note by running:
   `python .\scripts\obsidian\update_obsidian_note.py --summary "<short summary>" --files "<comma-separated changed files or none>"`

Rules:

- The Obsidian vault defaults to `C:\dev\claude-brain`.
- The note path defaults to `Projetos\<repo-folder-name>.md`.
- If the note is missing, continue the task and mention that the note could not be read.
- If the vault is not writable in the current sandbox, request approval instead of silently skipping the update.
- Keep the Obsidian update concise and factual.
