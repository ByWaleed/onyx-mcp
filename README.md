# Onyx MCP

[![CI](https://github.com/ByWaleed/onyx-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/ByWaleed/onyx-mcp/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

MCP Registry name: `io.github.ByWaleed/onyx-mcp`

A comprehensive, secure Model Context Protocol server for [Onyx](https://www.onyx.app/), formerly Danswer.

This project exposes Onyx search, chat, agents, projects, documents, connectors, ingestion, and deployment-specific APIs to MCP clients. It is an independent community project and is not an official Onyx package.

## Why This Server

- Uses the current `/chat/send-chat-message` contract.
- Defaults to Onyx's built-in assistant, persona `0`.
- Supports scoped Personal Access Tokens and legacy API keys.
- Starts read-only.
- Separately gates writes, administration, destructive actions, and raw API access.
- Applies request timeouts and response-size limits.
- Never logs authorization headers or tokens.
- Includes an advanced raw API tool for deployment-specific endpoints.

## Install

```bash
npx -y @bywaleed/onyx-mcp
```

Until the first npm release, clone the repository and run `npm install && npm run build`.

Versioned tarballs will be attached to [GitHub Releases](https://github.com/ByWaleed/onyx-mcp/releases) and published to GitHub Packages as `@bywaleed/onyx-mcp`.

## Configuration

Required:

| Variable         | Description                                                   |
| ---------------- | ------------------------------------------------------------- |
| `ONYX_API_URL`   | Onyx API base URL, for example `https://onyx.example.com/api` |
| `ONYX_API_TOKEN` | Onyx PAT or API key                                           |

Optional:

| Variable                      | Default   | Description                                                        |
| ----------------------------- | --------- | ------------------------------------------------------------------ |
| `ONYX_DEFAULT_PERSONA_ID`     | `0`       | Default agent used for new chats                                   |
| `ONYX_MCP_ENABLE_WRITE`       | `false`   | Registers tools that create or modify data                         |
| `ONYX_MCP_ENABLE_ADMIN`       | `false`   | Registers administrative tools                                     |
| `ONYX_MCP_ENABLE_DESTRUCTIVE` | `false`   | Registers destructive tools; write must also be enabled            |
| `ONYX_MCP_ENABLE_RAW_API`     | `false`   | Registers the advanced raw API tool; admin access is also required |
| `ONYX_MCP_TIMEOUT_MS`         | `30000`   | Request timeout                                                    |
| `ONYX_MCP_MAX_RESPONSE_BYTES` | `1000000` | Maximum accepted response body                                     |
| `ONYX_MCP_MAX_CONCURRENCY`    | `8`       | Maximum concurrent requests to Onyx                                |

Onyx still enforces the permissions attached to the supplied token. Enabling a profile cannot grant additional Onyx privileges.

## OpenCode

```json
{
  "mcp": {
    "onyx": {
      "type": "local",
      "command": ["npx", "-y", "@bywaleed/onyx-mcp"],
      "environment": {
        "ONYX_API_URL": "https://onyx.example.com/api",
        "ONYX_API_TOKEN": "{env:ONYX_API_TOKEN}"
      },
      "enabled": true
    }
  }
}
```

## Claude Desktop

```json
{
  "mcpServers": {
    "onyx": {
      "command": "npx",
      "args": ["-y", "@bywaleed/onyx-mcp"],
      "env": {
        "ONYX_API_URL": "https://onyx.example.com/api",
        "ONYX_API_TOKEN": "your-token"
      }
    }
  }
}
```

## Tool Profiles

The read-only profile includes health, identity, permissions, search, chat history, agents, projects, files, tools, document sets, and connector status.

The write profile adds chat creation, chat messages, feedback, and project updates.

The admin profile adds connector, credential, user, agent, and direct-ingestion administration.

The destructive profile adds individually confirmed deletion tools. Bulk deletion is intentionally not exposed as a first-class tool.

The raw API profile adds `onyx_api_request`. It covers APIs specific to an Onyx edition or version. Every raw request requires the admin profile. Mutations also require write access, and deletions require destructive access plus confirmation.

## Tools

The default profile provides health, version, identity, permission, search, agent, chat-history, project, file, document-set, tool, source, and connector-status tools. Write mode adds chat, feedback, and project mutations. Admin mode adds connector, credential, user, agent, and ingestion tools.

Run `onyx_capabilities` to inspect the active profile. MCP clients can also call `tools/list` for complete machine-readable schemas and safety annotations.

## Authentication

Prefer an Onyx PAT with the smallest required scope:

- `read:search` for search.
- `read:chat` for chat history.
- `write:chat` for chat creation and messages.

Some Onyx endpoints still use legacy role checks and need an unrestricted PAT or API key. Use a separate administrative server configuration for those operations.

Treat client configuration files as sensitive when they contain a token. Use a dedicated least-privilege token and restrict file permissions to your user account.

## Development

```bash
npm ci
npm run verify
```

## Compatibility

| Component        | Supported                                                                                           |
| ---------------- | --------------------------------------------------------------------------------------------------- |
| Node.js          | 20 and 22                                                                                           |
| MCP SDK/protocol | TypeScript SDK 1.x, MCP through `2025-11-25`                                                        |
| Onyx             | Current community and enterprise APIs; tested against the repository version documented in releases |
| Transport        | Local stdio                                                                                         |

The server uses non-streaming Onyx chat responses for a stable MCP result. Onyx editions and releases expose different administrative routes. The raw API tool provides an escape hatch while first-class tools remain curated and safe. MCP SDK 2.x migration is planned as a separate breaking compatibility release.

## Support And Security

- Usage questions: [GitHub Discussions](https://github.com/ByWaleed/onyx-mcp/discussions)
- Bugs and feature requests: [GitHub Issues](https://github.com/ByWaleed/onyx-mcp/issues)
- Vulnerabilities: [private security advisory](https://github.com/ByWaleed/onyx-mcp/security/advisories/new)
- Release history: [CHANGELOG.md](CHANGELOG.md)
- Maintainer release process: [RELEASING.md](RELEASING.md)
- MCP Registry metadata: [server.json](server.json)

## License

MIT
