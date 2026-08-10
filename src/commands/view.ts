import { AxiError } from "axi-sdk-js";
import { assertKnownFlags, parseFlags } from "../args.js";
import { collapseWhitespace, isoDate, truncateWithCount } from "../format.js";
import {
  fetchPackument,
  fetchVersion,
  type PypiFile,
  type PypiInfo,
} from "../pypi.js";

const SUMMARY_LIMIT = 800;
const USAGE = "pypi-axi view <pkg> [--version X] [--full]";
const AUTHOR_EMAIL_PATTERN = /^([^<]+)<[^>]+>$/;

function authorString(info: PypiInfo): string | undefined {
  if (info.author?.trim()) {
    return info.author.trim();
  }
  if (info.author_email?.trim()) {
    // "Name <email@example.com>" -> "Name"; a bare email is used as-is.
    const match = info.author_email.match(AUTHOR_EMAIL_PATTERN);
    return (match ? match[1] : info.author_email).trim();
  }
}

function projectUrls(info: PypiInfo): Record<string, string> | undefined {
  const urls: Record<string, string> = {};
  if (info.home_page) {
    urls.homepage = info.home_page;
  }
  if (info.project_urls) {
    for (const [key, value] of Object.entries(info.project_urls)) {
      if (value) {
        urls[key] = value;
      }
    }
  }
  return Object.keys(urls).length > 0 ? urls : undefined;
}

function latestUploadDate(files: PypiFile[]): string | undefined {
  const dates = files
    .map((f) => f.upload_time_iso_8601)
    .filter((d): d is string => Boolean(d));
  if (dates.length === 0) {
    return;
  }
  return isoDate(dates.reduce((a, b) => (a > b ? a : b)));
}

export async function viewCommand(
  args: string[]
): Promise<Record<string, unknown>> {
  const { positionals, flags } = parseFlags(args, ["full"]);
  assertKnownFlags(flags, ["full", "version"], USAGE);
  const [pkg] = positionals;
  if (!pkg) {
    throw new AxiError("a package name is required", "VALIDATION_ERROR", [
      USAGE,
    ]);
  }

  const version = typeof flags.version === "string" ? flags.version : undefined;
  const full = flags.full === true;

  const packument = await fetchPackument(pkg);
  const versionDoc = version ? await fetchVersion(pkg, version) : undefined;
  const info = versionDoc ? versionDoc.info : packument.info;
  const urls = versionDoc ? versionDoc.urls : packument.urls;

  const pkgOut: Record<string, unknown> = {
    name: info.name ?? pkg,
    version: info.version ?? version ?? "unknown",
  };

  let truncated = false;
  if (info.summary) {
    if (full) {
      pkgOut.summary = collapseWhitespace(info.summary);
    } else {
      const { text, truncated: wasTruncated } = truncateWithCount(
        info.summary,
        SUMMARY_LIMIT
      );
      pkgOut.summary = text;
      truncated = wasTruncated;
    }
  }

  const author = authorString(info);
  if (author) {
    pkgOut.author = author;
  }

  const license = info.license || info.license_expression;
  if (license) {
    pkgOut.license = license;
  }

  if (info.requires_python) {
    pkgOut.requiresPython = info.requires_python;
  }

  const urlsOut = projectUrls(info);
  if (urlsOut) {
    pkgOut.projectUrls = urlsOut;
  }

  pkgOut.releaseCount = Object.keys(packument.releases).length;

  const uploaded = latestUploadDate(urls);
  if (uploaded) {
    pkgOut.latestUpload = uploaded;
  }

  pkgOut.dependencyCount = Array.isArray(info.requires_dist)
    ? info.requires_dist.length
    : 0;

  const out: Record<string, unknown> = { package: pkgOut };
  if (truncated) {
    out.help = [
      `Run \`pypi-axi view ${pkg} --full\` to see the complete summary`,
    ];
  }
  return out;
}
