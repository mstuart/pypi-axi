export const TOP_LEVEL_HELP = `pypi-axi — inspect PyPI packages with token-efficient output

Usage: pypi-axi <command> [args] [flags]

Commands:
  view <pkg> [--version X] [--full]   Package details: version, summary, license, deps
  versions <pkg> [--limit 20]         Release history, newest first
  deps <pkg> [--version X]            Declared dependencies (requires_dist)
  downloads <pkg>                     Recent download counts (day/week/month)
  search                              Not supported — PyPI has no public search API
  setup hooks                         Install agent session-start hooks (ambient context)

Run with no arguments to see the current project's declared Python dependencies
(from requirements.txt, pyproject.toml, or setup.py) alongside their latest
versions on PyPI, or command hints when no project file is found.
Run \`pypi-axi <command> --help\` for per-command details.
`;

export const COMMAND_HELP: Record<string, string> = {
  view: `pypi-axi view <pkg> [--version X] [--full]

Show package details: version, summary, author, license, required Python version,
project URLs, release count, latest upload date, and dependency count.

Flags:
  --version <X>   Inspect a specific release instead of the latest
  --full          Print the complete summary instead of a ~800 char preview

Examples:
  pypi-axi view requests
  pypi-axi view django --version 4.2.0
`,
  versions: `pypi-axi versions <pkg> [--limit 20]

List a package's release history, newest first, with upload dates and yanked status.

Flags:
  --limit <n>   Max versions shown (default 20, max 100)

Examples:
  pypi-axi versions flask
  pypi-axi versions numpy --limit 50
`,
  deps: `pypi-axi deps <pkg> [--version X]

List a package's declared dependencies (from requires_dist): name, version
specifier, and extra/environment marker where present.

Flags:
  --version <X>   Inspect a specific release instead of the latest

Examples:
  pypi-axi deps flask
  pypi-axi deps requests --version 2.31.0
`,
  downloads: `pypi-axi downloads <pkg>

Show last-day, last-week, and last-month download counts from pypistats.org.

Examples:
  pypi-axi downloads requests
`,
  search: `pypi-axi search

PyPI has no public search API, so this always returns an error suggesting
\`pypi-axi view <pkg>\` instead of scraping the HTML search page.
`,
  setup: `pypi-axi setup hooks

Install or repair session-start hooks so agents see pypi-axi guidance at the start
of each session. Supports Claude Code, Codex, and OpenCode. Idempotent.

Examples:
  pypi-axi setup hooks
`,
};
