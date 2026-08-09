# Security Policy

`pypi-axi` is a local-first, read-only CLI. It makes outbound requests to exactly one purpose
per host, and only two hosts:

- `pypi.org` — package metadata (`/pypi/<name>/json`, `/pypi/<name>/<version>/json`)
- `pypistats.org` — recent download counts

It requires no authentication, stores no credentials, and does not write anywhere on disk
except the opt-in `setup hooks` command, which installs session-start hook configuration for
Claude Code, Codex, and OpenCode.

## Supported Versions

Security fixes are provided for the latest published npm release and the default branch of
this repository.

## Reporting a Vulnerability

Please do not report security vulnerabilities through public GitHub issues.

Use GitHub's private vulnerability reporting for this repository:

https://github.com/mstuart/pypi-axi/security/advisories/new

Include:

- Affected command or package version
- Steps to reproduce
- Expected impact
- Any suggested mitigation

I will review valid reports as quickly as possible and coordinate a fix before public
disclosure.
