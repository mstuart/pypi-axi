import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { setupCommand } from "../../src/commands/setup.js";

describe("setupCommand", () => {
  const originalHome = process.env.HOME;

  afterEach(() => {
    if (originalHome === undefined) {
      delete process.env.HOME;
    } else {
      process.env.HOME = originalHome;
    }
  });

  // Deliberately does not exercise the "hooks" success path here: that calls
  // the real installSessionStartHooks(), which writes to the developer's
  // actual ~/.claude and ~/.codex config. That path is covered by axi-sdk-js's
  // own test suite; here we only check the validation the command owns.
  it("rejects any setup subcommand other than hooks", async () => {
    await expect(setupCommand([])).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
    });
    await expect(setupCommand(["nope"])).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
    });
  });

  it("rejects an unknown flag", async () => {
    await expect(setupCommand(["hooks", "--bogus"])).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      suggestions: expect.arrayContaining(["valid flags: --check"]),
    });
  });

  it("verifies hook setup without writing to the real home directory", async () => {
    const home = mkdtempSync(join(tmpdir(), "pypi-axi-hooks-"));
    process.env.HOME = home;

    try {
      mkdirSync(join(home, ".claude"), { recursive: true });
      mkdirSync(join(home, ".codex"), { recursive: true });
      mkdirSync(join(home, ".config", "opencode", "plugins"), {
        recursive: true,
      });
      writeFileSync(join(home, ".claude", "settings.json"), "pypi-axi", "utf8");
      writeFileSync(join(home, ".codex", "hooks.json"), "pypi-axi", "utf8");
      writeFileSync(
        join(home, ".codex", "config.toml"),
        "[features]\nhooks = true\n",
        "utf8"
      );
      writeFileSync(
        join(home, ".config", "opencode", "plugins", "axi-pypi-axi.js"),
        "axi-sdk-js managed opencode plugin: pypi-axi",
        "utf8"
      );

      await expect(setupCommand(["hooks", "--check"])).resolves.toMatchObject({
        setup: "hooks verified",
        targets: {
          claude: true,
          codexHooks: true,
          codexHooksEnabled: true,
          opencode: true,
        },
      });
    } finally {
      rmSync(home, { force: true, recursive: true });
    }
  });
});
