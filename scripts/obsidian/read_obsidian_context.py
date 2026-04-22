from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path


DEFAULT_VAULT = Path(r"C:\dev\claude-brain")


def build_note_path(vault: Path, project: str) -> Path:
    return vault / "Projetos" / f"{project}.md"


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Read the Obsidian note that matches the current project folder."
    )
    parser.add_argument("--vault", default=os.environ.get("OBSIDIAN_VAULT", str(DEFAULT_VAULT)))
    parser.add_argument("--project", default=Path.cwd().name)
    args = parser.parse_args()

    note_path = build_note_path(Path(args.vault), args.project)
    if not note_path.exists():
        print(f"Obsidian note not found: {note_path}", file=sys.stderr)
        return 1

    print(f"[Obsidian - {args.project}]")
    print(note_path.read_text(encoding="utf-8"))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
