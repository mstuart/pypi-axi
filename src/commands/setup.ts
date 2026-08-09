import { AxiError, installSessionStartHooks } from "axi-sdk-js";

export async function setupCommand(args: string[]): Promise<Record<string, unknown>> {
  if (args[0] !== "hooks") {
    throw new AxiError("unknown setup command", "VALIDATION_ERROR", [
      "Run `pypi-axi setup hooks`",
    ]);
  }

  installSessionStartHooks({ marker: "pypi-axi", binaryNames: ["pypi-axi"] });
  return { setup: "hooks installed or already up to date" };
}
