# Security Policy

## Reporting

Report security issues privately through [GitHub Security Advisories](https://github.com/ByWaleed/onyx-mcp/security/advisories/new). Do not create a public issue for a suspected vulnerability.

You should receive an acknowledgement within seven days. Resolution time depends on severity and complexity.

## Supported Versions

| Version        | Supported   |
| -------------- | ----------- |
| Latest release | Yes         |
| Older releases | Best effort |

## Credential Safety

- Use a scoped Onyx Personal Access Token where possible.
- Do not commit tokens or put them directly in shared configuration files.
- Run administrative access as a separate MCP server configuration.
- Leave destructive and raw API access disabled unless required.
- Raw API access always requires the administrative profile.
- Use HTTPS for remote Onyx deployments. Plain HTTP is accepted only for loopback development hosts.
- Rotate a token immediately if it appears in logs, shell history, or source control.

## Safety Model

This server has local capability gates, but Onyx is the source of truth for authorization. The server cannot grant access that the configured Onyx token does not have.

Destructive first-class tools require both `ONYX_MCP_ENABLE_DESTRUCTIVE=true` and an explicit `confirm: true` argument. All raw non-GET requests have the same requirement.

Web search and URL fetching are disabled by default. URL fetching requires an HTTPS hostname allowlist. The Onyx deployment should independently reject private, loopback, link-local, and rebinding destinations after DNS resolution and redirects.
