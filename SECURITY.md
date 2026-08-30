# Security Policy

## Reporting

Report security issues privately through GitHub Security Advisories for this repository. Do not create a public issue for a suspected vulnerability.

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

Destructive first-class tools require both `ONYX_MCP_ENABLE_DESTRUCTIVE=true` and an explicit `confirm: true` argument. Raw DELETE requests have the same requirement.
