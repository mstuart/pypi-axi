import { AxiError, installSessionStartHooks } from "axi-sdk-js";
import { assertKnownFlags, parseFlags } from "../args.js";

const USAGE = "pypi-axi setup hooks";

export async function setupCommand(args: string[]): Promise<Record<string, unknown>> {
  const { positionals, flags } = parseFlags(args);
  assertKnownFlags(flags, [], USAGE);
  if (positionals[0] !== "hooks") {
    throw new AxiError("unknown setup command", "VALIDATION_ERROR", [USAGE]);
  }

  installSessionStartHooks({ marker: "pypi-axi", binaryNames: ["pypi-axi"] });
  return { setup: "hooks installed or already up to date" };
}
