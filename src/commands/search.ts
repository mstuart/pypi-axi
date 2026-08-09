import { AxiError } from "axi-sdk-js";
import { assertKnownFlags, parseFlags } from "../args.js";

/**
 * PyPI has no public search API (the old `/search` XML-RPC endpoint was
 * retired). Return an honest, structured error instead of scraping the HTML
 * search page.
 */
export async function searchCommand(args: string[]): Promise<Record<string, unknown>> {
  const { flags } = parseFlags(args);
  assertKnownFlags(flags, [], "pypi-axi search");
  throw new AxiError("PyPI has no public search API", "VALIDATION_ERROR", [
    "Use `pypi-axi view <package>` to inspect a known package",
  ]);
}
