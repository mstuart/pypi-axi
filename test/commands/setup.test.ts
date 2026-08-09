import { describe, expect, it } from "vitest";
import { setupCommand } from "../../src/commands/setup.js";

describe("setupCommand", () => {
  // Deliberately does not exercise the "hooks" success path here: that calls
  // the real installSessionStartHooks(), which writes to the developer's
  // actual ~/.claude and ~/.codex config. That path is covered by axi-sdk-js's
  // own test suite; here we only check the validation the command owns.
  it("rejects any setup subcommand other than hooks", async () => {
    await expect(setupCommand([])).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
    await expect(setupCommand(["nope"])).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
  });
});
