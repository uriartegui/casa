#!/usr/bin/env python3
"""
Obsidian Context Injector
========================
SessionStart hook: reads the Obsidian project note for the current working
directory and prints it to stdout so Claude gets it injected as context
automatically — no manual read needed, zero extra tokens.

Vault path: configured in hooks-config.json as "obsidianVault"
Default: C:/dev/claude-brain
"""

import sys
import json
import os
from pathlib import Path

# ===== CONFIG =====
DEFAULT_VAULT = Path("C:/dev/claude-brain")


def load_vault_path() -> Path:
    """Read obsidianVault from hooks-config.json (or local override)."""
    script_dir = Path(__file__).parent          # .claude/hooks/scripts/
    config_dir = script_dir.parent / "config"   # .claude/hooks/config/

    for config_file in ["hooks-config.local.json", "hooks-config.json"]:
        cfg_path = config_dir / config_file
        if cfg_path.exists():
            try:
                cfg = json.loads(cfg_path.read_text(encoding="utf-8"))
                if "obsidianVault" in cfg:
                    return Path(cfg["obsidianVault"])
            except Exception:
                pass

    return Path(os.environ.get("OBSIDIAN_VAULT", str(DEFAULT_VAULT)))


def get_project_name(cwd: str) -> str:
    return Path(cwd).name


def read_project_note(vault: Path, project: str) -> str | None:
    note = vault / "Projetos" / f"{project}.md"
    if note.exists():
        return note.read_text(encoding="utf-8")
    return None


def main():
    raw = sys.stdin.read().strip()
    if not raw:
        sys.exit(0)

    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        sys.exit(0)

    cwd = data.get("cwd", "")
    if not cwd:
        sys.exit(0)

    project = get_project_name(cwd)
    vault = load_vault_path()
    note = read_project_note(vault, project)

    if note:
        print(f"[Obsidian — {project}]")
        print(note)

    sys.exit(0)


if __name__ == "__main__":
    main()
