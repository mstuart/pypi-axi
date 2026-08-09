<h1 align="center">pypi-axi</h1>

<p align="center">
  <a href="https://www.npmjs.com/package/pypi-axi"><img alt="npm" src="https://img.shields.io/npm/v/pypi-axi?style=flat-square" /></a>
  <a href="https://github.com/mstuart/pypi-axi/actions/workflows/ci.yml"><img alt="CI" src="https://img.shields.io/github/actions/workflow/status/mstuart/pypi-axi/ci.yml?style=flat-square&label=ci" /></a>
  <a href="https://github.com/mstuart/pypi-axi/actions/workflows/release.yml"><img alt="Release" src="https://img.shields.io/github/actions/workflow/status/mstuart/pypi-axi/release.yml?style=flat-square&label=release" /></a>
  <img alt="Platform" src="https://img.shields.io/badge/platform-macOS%20%7C%20Linux%20%7C%20Windows-blue?style=flat-square" />
  <a href="LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" /></a>
</p>

<p align="center">Inspect PyPI packages with token-efficient output — an <a href="https://github.com/kunchenguid/axi">AXI</a> (Agent eXperience Interface).</p>

---

`pypi-axi` wraps the public PyPI JSON API in an agent-ergonomic CLI. It returns
[TOON](https://toonformat.dev/) output (~40% fewer tokens than JSON), minimal default
schemas, pre-computed aggregates, and structured errors — so an agent can answer "what's the
latest version of X", "what does X depend on", or "how popular is X by downloads" in a single
call. Read-only, no authentication required.

## Install

```sh
npm install -g pypi-axi
```

Or run without installing:

```sh
npx -y pypi-axi <command>
```

## Usage

The examples below are snapshots of live PyPI output; versions, dates, and counts will drift
as packages change.

### view

```sh
$ pypi-axi view requests
package:
  name: requests
  version: 2.34.2
  summary: Python HTTP for Humans.
  author: Kenneth Reitz
  license: Apache-2.0
  requiresPython: >=3.10
  projectUrls:
    Documentation: "https://requests.readthedocs.io"
    Source: "https://github.com/psf/requests"
  releaseCount: 163
  latestUpload: 2026-05-14
  dependencyCount: 6
```

Pass `--version <X>` to inspect a specific release, or `--full` to print the complete summary
instead of the ~800 char preview.

### versions

```sh
$ pypi-axi versions requests --limit 5
count: 5 of 160 total
versions[5]{version,uploadDate,yanked}:
  2.34.2,2026-05-14,no
  2.34.1,2026-05-13,no
  2.34.0,2026-05-11,no
  2.34.0.dev1,2026-05-03,no
  2.33.1,2026-03-30,no
```

### deps

```sh
$ pypi-axi deps flask
package: Flask
version: 3.1.3
count: 9
deps[9]:
  - dep: blinker
    spec: >=1.9.0
  - dep: click
    spec: >=8.1.3
  - dep: importlib-metadata
    spec: >=3.6.0
    marker: "python_version < \"3.10\""
  ...
```

Packages with no dependencies return a definitive `0 dependencies for <pkg> <version>` result
instead of an empty list.

### downloads

```sh
$ pypi-axi downloads requests
downloads:
  package: requests
  lastDay: 47943472
  lastWeek: 428064895
  lastMonth: 1715479760
```

Packages pypistats has no data for yet return `{ status: "no download data available yet" }`
instead of an error.

### search

PyPI has no public search API (the old XML-RPC search endpoint was retired), so `search`
always returns an honest error instead of scraping the HTML search page:

```sh
$ pypi-axi search foo
error: PyPI has no public search API
code: VALIDATION_ERROR
help[1]: Use `pypi-axi view <package>` to inspect a known package
```

### No arguments

Running `pypi-axi` with no arguments prints the tool identity and command hints. Inside a
Python project (a directory with `requirements.txt`, `pyproject.toml`, or `setup.py`), it
also shows the declared dependencies alongside their latest available version on PyPI:

```sh
$ pypi-axi
bin: ~/.local/bin/pypi-axi
description: Inspect PyPI packages — versions, summaries, dependencies, downloads — with token-efficient output
project:
  source: requirements.txt
  dependencyCount: 3
  dependencies[3]{name,declaredSpec,latestAvailable}:
    requests,==2.31.0,2.34.2
    flask,>=2.0,3.1.3
    numpy,any,2.5.1
```

## Agent integration

`pypi-axi` follows the AXI principle of offering an opt-in session integration first, and an
on-demand skill second.

**Session hooks (ambient context):**

```sh
pypi-axi setup hooks
```

Installs idempotent `SessionStart` hooks for Claude Code, Codex, and OpenCode so agents see
pypi-axi guidance at the start of each session.

**Agent Skill (on-demand):**

```sh
npx skills add mstuart/pypi-axi --skill pypi-axi
```

You only need one of these — they complement each other when both are installed.

## How it maps to the 10 AXI principles

| # | Principle | In pypi-axi |
| --- | --- | --- |
| 1 | Token-efficient output | TOON on stdout via `axi-sdk-js` |
| 2 | Minimal default schemas | `versions` returns version, uploadDate, yanked |
| 3 | Content truncation | summary preview with `... (truncated, N chars total)` + `--full` |
| 4 | Pre-computed aggregates | release counts, dependency counts, "N of M total" |
| 5 | Definitive empty states | `0 dependencies for <pkg> <version>`, "no download data available yet" |
| 6 | Structured errors & exit codes | TOON errors; `0`/`1`/`2` exit codes; no prompts |
| 7 | Ambient context | `setup hooks` + installable skill |
| 8 | Content first | no-args shows the local project's declared dependencies |
| 9 | Contextual disclosure | next-step `help` lines on truncated/erroring output |
| 10 | Consistent help | `pypi-axi <command> --help`; fast `--version` path |

## Development

```sh
npm install
npm test              # vitest, fetch mocked against captured fixtures + one live check
npm run build          # tsc -> dist
npm run build:skill     # regenerate skills/pypi-axi/SKILL.md from the CLI's own help text
npm run dev -- view requests   # run from source
```

## License

[MIT](LICENSE)
