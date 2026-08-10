import { AxiError, installSessionStartHooks } from "axi-sdk-js";
import { assertKnownFlags, parseFlags } from "../args.js";

const USAGE = "pypi-axi setup hooks";

// biome-ignore lint/suspicious/useAwait: AXI command handlers intentionally share an async API.
export async function setupCommand(
  args: string[]
): Promise<Record<string, unknown>> {
  const { positionals, flags } = parseFlags(args);
  assertKnownFlags(flags, [], USAGE);
  if (positionals[0] !== "hooks") {
    throw new AxiError("unknown setup command", "VALIDATION_ERROR", [USAGE]);
  }

  installSessionStartHooks({ binaryNames: ["pypi-axi"], marker: "pypi-axi" });
  return { setup: "hooks installed or already up to date" };
}
