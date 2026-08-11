---
name: pypi-axi
description: "Inspect PyPI (Python Package Index) packages — look up a package's latest version, summary, license, declared dependencies, release history, or download counts. Use whenever a task involves a Python package: checking the latest version of a package, what it depends on, when it was last released, or how popular it is."
user-invocable: false
---

# pypi-axi

Inspect PyPI packages — versions, summaries, dependencies, downloads — with token-efficient output

You do not need pypi-axi installed globally - invoke it with `npx -y pypi-axi <command>`.
If pypi-axi output shows a follow-up command starting with `pypi-axi`, run it as
`npx -y pypi-axi ...` instead.

pypi-axi is read-only and requires no authentication. It talks to pypi.org and
pypistats.org only.

## When to use

Use pypi-axi whenever a task touches PyPI: checking a package's latest version,
license, or summary; listing recent releases; inspecting declared dependencies;
checking download counts; or reviewing the Python dependencies declared by the
current project (requirements.txt, pyproject.toml, or setup.py).

## Workflow

1. Run `npx -y pypi-axi` with no arguments inside a Python project for a table of
   declared dependencies and their latest available versions on PyPI.
2. Look up a package directly: `view <pkg>`, `versions <pkg>`, `deps <pkg>`,
   `downloads <pkg>`.
3. Pin to a specific release with `--version <X>` on `view` or `deps`.
4. PyPI has no public search API - `search` returns an honest error suggesting
   `view` instead of scraping the HTML search page.
5. Every response ends with contextual next-step hints under `help:` where
   relevant - follow them.

## Commands

```
pypi-axi — inspect PyPI packages with token-efficient output

Usage: pypi-axi <command> [args] [flags]

Commands:
  view <pkg> [--version X] [--full]   Package details: version, summary, license, deps
  versions <pkg> [--limit 20]         Release history, newest first
  deps <pkg> [--version X]            Declared dependencies (requires_dist)
  downloads <pkg>                     Recent download counts (day/week/month)
  search                              Not supported — PyPI has no public search API
  setup hooks [--check]               Install or verify agent session-start hooks

Run with no arguments to see the current project's declared Python dependencies
(from requirements.txt, pyproject.toml, or setup.py) alongside their latest
versions on PyPI, or command hints when no project file is found.
Run `pypi-axi <command> --help` for per-command details.
```

Installed copies also inherit the SDK built-in `update` command.
Run `pypi-axi update --check` to compare the installed version with npm, or
`pypi-axi update` to upgrade.
When using `npx -y pypi-axi`, npx already resolves the package on demand.

Run `npx -y pypi-axi --help` for global flags, or `npx -y pypi-axi <command> --help`
for per-command usage.

## Tips

- Output is TOON-encoded and token-efficient.
- Package names are normalized per PEP 503 (case-insensitive, `-`/`_`/`.` treated
  as equivalent), so `Flask_Cors` and `flask-cors` resolve to the same package.
- `view` truncates long summaries at ~800 characters with a
  `... (truncated, N chars total)` note; pass `--full` for the complete text.
- `downloads` returns a definitive "no download data available yet" result
  instead of an error when pypistats has no stats for a package.
