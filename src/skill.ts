import { DESCRIPTION } from "./cli.js";
import { TOP_LEVEL_HELP } from "./help.js";

// Trigger string agents match against to auto-load the skill.
export const SKILL_DESCRIPTION =
  "Inspect PyPI (Python Package Index) packages — look up a package's latest version, " +
  "summary, license, declared dependencies, release history, or download counts. " +
  "Use whenever a task involves a Python package: checking the latest version of a " +
  "package, what it depends on, when it was last released, or how popular it is.";

function yamlDoubleQuote(value: string): string {
  return JSON.stringify(value);
}

/**
 * Render the installable SKILL.md for the pypi-axi skill. The body is built
 * from the same shared guidance the CLI prints (description and top-level
 * help), rewriting invocations to non-interactive `npx -y pypi-axi ...` so
 * the CLI comes along on demand.
 *
 * @returns full SKILL.md contents including YAML frontmatter
 */
export function createSkillMarkdown(): string {
  return `---
name: pypi-axi
description: ${yamlDoubleQuote(SKILL_DESCRIPTION)}
user-invocable: false
---

# pypi-axi

${DESCRIPTION}

You do not need pypi-axi installed globally - invoke it with \`npx -y pypi-axi <command>\`.
If pypi-axi output shows a follow-up command starting with \`pypi-axi\`, run it as
\`npx -y pypi-axi ...\` instead.

pypi-axi is read-only and requires no authentication. It talks to pypi.org and
pypistats.org only.

## When to use

Use pypi-axi whenever a task touches PyPI: checking a package's latest version,
license, or summary; listing recent releases; inspecting declared dependencies;
checking download counts; or reviewing the Python dependencies declared by the
current project (requirements.txt, pyproject.toml, or setup.py).

## Workflow

1. Run \`npx -y pypi-axi\` with no arguments inside a Python project for a table of
   declared dependencies and their latest available versions on PyPI.
2. Look up a package directly: \`view <pkg>\`, \`versions <pkg>\`, \`deps <pkg>\`,
   \`downloads <pkg>\`.
3. Pin to a specific release with \`--version <X>\` on \`view\` or \`deps\`.
4. PyPI has no public search API - \`search\` returns an honest error suggesting
   \`view\` instead of scraping the HTML search page.
5. Every response ends with contextual next-step hints under \`help:\` where
   relevant - follow them.

## Commands

\`\`\`
${TOP_LEVEL_HELP}\`\`\`

Installed copies also inherit the SDK built-in \`update\` command.
Run \`pypi-axi update --check\` to compare the installed version with npm, or
\`pypi-axi update\` to upgrade.
When using \`npx -y pypi-axi\`, npx already resolves the package on demand.

Run \`npx -y pypi-axi --help\` for global flags, or \`npx -y pypi-axi <command> --help\`
for per-command usage.

## Tips

- Output is TOON-encoded and token-efficient.
- Package names are normalized per PEP 503 (case-insensitive, \`-\`/\`_\`/\`.\` treated
  as equivalent), so \`Flask_Cors\` and \`flask-cors\` resolve to the same package.
- \`view\` truncates long summaries at ~800 characters with a
  \`... (truncated, N chars total)\` note; pass \`--full\` for the complete text.
- \`downloads\` returns a definitive "no download data available yet" result
  instead of an error when pypistats has no stats for a package.
`;
}
