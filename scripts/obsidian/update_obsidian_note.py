from __future__ import annotations

import argparse
import os
from datetime import datetime
from pathlib import Path


DEFAULT_VAULT = Path(r"C:\dev\claude-brain")
START_MARKER = "<!-- codex:auto:start -->"
END_MARKER = "<!-- codex:auto:end -->"


def build_note_path(vault: Path, project: str) -> Path:
    return vault / "Projetos" / f"{project}.md"


def render_block(summary: str, files: str, timestamp: str) -> str:
    return "\n".join(
        [
            START_MARKER,
            "## Ultima sessao Codex",
            f"- Atualizado: {timestamp}",
            f"- Resumo: {summary.strip()}",
            f"- Arquivos: {files.strip() or 'none'}",
            END_MARKER,
        ]
    )


def upsert_block(content: str, block: str) -> str:
    if START_MARKER in content and END_MARKER in content:
        start = content.index(START_MARKER)
        end = content.index(END_MARKER) + len(END_MARKER)
        updated = content[:start].rstrip() + "\n\n" + block + "\n"
        tail = content[end:].lstrip()
        if tail:
            updated += "\n" + tail
        return updated

    base = content.rstrip()
    if base:
        return base + "\n\n" + block + "\n"
    return block + "\n"


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Update the auto-managed Codex section in the Obsidian project note."
    )
    parser.add_argument("--summary", required=True)
    parser.add_argument("--files", default="none")
    parser.add_argument("--vault", default=os.environ.get("OBSIDIAN_VAULT", str(DEFAULT_VAULT)))
    parser.add_argument("--project", default=Path.cwd().name)
    args = parser.parse_args()

    note_path = build_note_path(Path(args.vault), args.project)
    note_path.parent.mkdir(parents=True, exist_ok=True)

    existing = note_path.read_text(encoding="utf-8") if note_path.exists() else ""
    timestamp = datetime.now().astimezone().strftime("%Y-%m-%d %H:%M:%S %z")
    block = render_block(args.summary, args.files, timestamp)
    note_path.write_text(upsert_block(existing, block), encoding="utf-8")
    print(f"Updated Obsidian note: {note_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
