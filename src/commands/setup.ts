import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { AxiError, installSessionStartHooks } from "axi-sdk-js";
import { assertKnownFlags, parseFlags } from "../args.js";

const USAGE = "pypi-axi setup hooks [--check]";
const MARKER = "pypi-axi";

function fileIncludes(path: string, needle: string): boolean {
  return existsSync(path) && readFileSync(path, "utf-8").includes(needle);
}

function hooksStatus(): Record<string, unknown> {
  const home = homedir();
  const claude = join(home, ".claude", "settings.json");
  const codexHooks = join(home, ".codex", "hooks.json");
  const codexConfig = join(home, ".codex", "config.toml");
  const opencode = join(
    home,
    ".config",
    "opencode",
    "plugins",
    `axi-${MARKER}.js`
  );

  const targets = {
    claude: fileIncludes(claude, MARKER),
    codexHooks: fileIncludes(codexHooks, MARKER),
    codexHooksEnabled: fileIncludes(codexConfig, "hooks = true"),
    opencode: fileIncludes(
      opencode,
      `axi-sdk-js managed opencode plugin: ${MARKER}`
    ),
  };

  return {
    help: [
      "Run `pypi-axi setup hooks` to install or repair missing hooks",
      "To undo, remove pypi-axi SessionStart entries from ~/.claude/settings.json and ~/.codex/hooks.json, remove ~/.config/opencode/plugins/axi-pypi-axi.js, and disable Codex hooks only if no other hook users need them in ~/.codex/config.toml",
    ],
    setup: Object.values(targets).every(Boolean)
      ? "hooks verified"
      : "hooks not fully installed",
    targets,
  };
}

// biome-ignore lint/suspicious/useAwait: AXI command handlers intentionally share an async API.
export async function setupCommand(
  args: string[]
): Promise<Record<string, unknown>> {
  const { positionals, flags } = parseFlags(args, ["check"]);
  assertKnownFlags(flags, ["check"], USAGE);
  if (positionals[0] !== "hooks") {
    throw new AxiError("unknown setup command", "VALIDATION_ERROR", [USAGE]);
  }

  if (flags.check === true) {
    return hooksStatus();
  }

  installSessionStartHooks({ binaryNames: [MARKER], marker: MARKER });
  return {
    setup: "hooks installed or already up to date",
    undo: "Remove pypi-axi SessionStart entries from ~/.claude/settings.json and ~/.codex/hooks.json, remove ~/.config/opencode/plugins/axi-pypi-axi.js, and disable Codex hooks only if no other hook users need them in ~/.codex/config.toml",
    verify: "Run `pypi-axi setup hooks --check` to verify installed targets",
  };
}
