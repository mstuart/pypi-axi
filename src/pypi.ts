import { AxiError } from "axi-sdk-js";
import { normalizeName } from "./format.js";

const PYPI_BASE = "https://pypi.org/pypi";
const PYPISTATS_BASE = "https://pypistats.org/api/packages";
const FETCH_TIMEOUT_MS = 15_000;

export interface PypiInfo {
  author?: string;
  author_email?: string;
  home_page?: string;
  license?: string;
  license_expression?: string;
  maintainer?: string;
  maintainer_email?: string;
  name?: string;
  project_urls?: Record<string, string>;
  requires_dist?: string[];
  requires_python?: string;
  summary?: string;
  version?: string;
  yanked?: boolean;
  yanked_reason?: string;
}

export interface PypiFile {
  filename: string;
  packagetype?: string;
  upload_time_iso_8601?: string;
  yanked?: boolean;
  yanked_reason?: string;
}

/** The unversioned `/pypi/<pkg>/json` document: latest info plus every release. */
export interface Packument {
  info: PypiInfo;
  releases: Record<string, PypiFile[]>;
  urls: PypiFile[];
}

/** The versioned `/pypi/<pkg>/<version>/json` document: info for one release only. */
export interface VersionDoc {
  info: PypiInfo;
  urls: PypiFile[];
}

export interface DownloadsRecent {
  last_day: number;
  last_month: number;
  last_week: number;
}

function notFound(pkg: string): AxiError {
  return new AxiError(`package "${pkg}" not found on PyPI`, "NOT_FOUND", [
    `Run \`pypi-axi view ${pkg}\` again to double check the name`,
  ]);
}

/** Single chokepoint for fetch/parse/error translation into a typed AxiError. */
async function getJson(url: string): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(url, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
  } catch {
    // biome-ignore lint/style/useErrorCause: AxiError's constructor accepts AXI hints rather than ErrorOptions.
    throw new AxiError("could not reach PyPI", "NETWORK", [
      "Check your network connection and try again",
    ]);
  }
  if (!response.ok) {
    // Signal 404 distinctly so callers can translate it into a NOT_FOUND.
    const error = new Error(`HTTP ${response.status}`) as Error & {
      status?: number;
    };
    error.status = response.status;
    throw error;
  }
  try {
    return await response.json();
  } catch {
    // biome-ignore lint/style/useErrorCause: AxiError's constructor accepts AXI hints rather than ErrorOptions.
    throw new AxiError("PyPI returned an unexpected response", "REGISTRY", [
      "Try again in a moment",
    ]);
  }
}

/** Fetch the unversioned packument, translating a 404 into a NOT_FOUND AxiError. */
export async function fetchPackument(pkg: string): Promise<Packument> {
  const name = normalizeName(pkg);
  try {
    return (await getJson(
      `${PYPI_BASE}/${encodeURIComponent(name)}/json`
    )) as Packument;
  } catch (error) {
    if (error instanceof AxiError) {
      throw error;
    }
    if ((error as { status?: number }).status === 404) {
      throw notFound(pkg);
    }
    // biome-ignore lint/style/useErrorCause: AxiError's constructor accepts AXI hints rather than ErrorOptions.
    throw new AxiError("PyPI returned an unexpected error", "REGISTRY", [
      "Try again in a moment",
    ]);
  }
}

/** Fetch a specific release's metadata, translating a 404 into a NOT_FOUND AxiError. */
export async function fetchVersion(
  pkg: string,
  version: string
): Promise<VersionDoc> {
  const name = normalizeName(pkg);
  try {
    return (await getJson(
      `${PYPI_BASE}/${encodeURIComponent(name)}/${encodeURIComponent(version)}/json`
    )) as VersionDoc;
  } catch (error) {
    if (error instanceof AxiError) {
      throw error;
    }
    if ((error as { status?: number }).status === 404) {
      // biome-ignore lint/style/useErrorCause: AxiError's constructor accepts AXI hints rather than ErrorOptions.
      throw new AxiError(
        `version "${version}" of "${pkg}" not found on PyPI`,
        "NOT_FOUND",
        [`Run \`pypi-axi versions ${pkg}\` to see available versions`]
      );
    }
    // biome-ignore lint/style/useErrorCause: AxiError's constructor accepts AXI hints rather than ErrorOptions.
    throw new AxiError("PyPI returned an unexpected error", "REGISTRY", [
      "Try again in a moment",
    ]);
  }
}

/**
 * Fetch recent download counts. Returns `null` when pypistats has no data yet
 * for this package (404), so callers can render a definitive empty state
 * instead of an error.
 */
export async function fetchDownloadsRecent(
  pkg: string
): Promise<DownloadsRecent | null> {
  const name = normalizeName(pkg);
  try {
    const data = (await getJson(
      `${PYPISTATS_BASE}/${encodeURIComponent(name)}/recent`
    )) as { data?: DownloadsRecent };
    return data.data ?? null;
  } catch (error) {
    if (error instanceof AxiError) {
      throw error;
    }
    if ((error as { status?: number }).status === 404) {
      return null;
    }
    // biome-ignore lint/style/useErrorCause: AxiError's constructor accepts AXI hints rather than ErrorOptions.
    throw new AxiError(
      "pypistats.org returned an unexpected error",
      "REGISTRY",
      ["Try again in a moment"]
    );
  }
}
