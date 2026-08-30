# Changelog

This project follows [Semantic Versioning](https://semver.org/). Before version 1.0, minor releases can include breaking changes when documented here.

## [Unreleased]

## [0.2.1] - 2026-08-30

### Security

- Disabled web search and URL fetching by default and added an HTTPS hostname allowlist for URL fetching.
- Required destructive mode and explicit confirmation for every raw non-GET request.
- Bounded the request queue and applied request timeouts while waiting for a concurrency slot.

## [0.2.0] - 2026-08-30

### Changed

- Renamed the canonical npm package from `@bywaleed/onyx-mcp` to `onyx-mcp` for simpler installation.
- Removed GitHub Packages publication because GitHub's npm registry requires scoped package names.

## [0.1.1] - 2026-08-30

### Fixed

- Corrected the case-sensitive MCP Registry namespace to `io.github.ByWaleed/onyx-mcp`.

## [0.1.0] - 2026-08-30

- Initial public implementation of secure Onyx search, chat, project, and administrative MCP tools.
- Open-source governance, support, and community health documentation.
- Cancellation propagation, request concurrency limits, complete MCP safety annotations, linting, formatting, coverage, and package smoke tests.
- GitHub Release artifacts, checksums, SPDX SBOM generation, build attestations, and workflows for GitHub Packages, npm, and the MCP Registry.

[Unreleased]: https://github.com/ByWaleed/onyx-mcp/compare/v0.2.1...HEAD
[0.2.1]: https://github.com/ByWaleed/onyx-mcp/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/ByWaleed/onyx-mcp/compare/v0.1.1...v0.2.0
[0.1.1]: https://github.com/ByWaleed/onyx-mcp/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/ByWaleed/onyx-mcp/releases/tag/v0.1.0
