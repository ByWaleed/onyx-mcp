# Contributing

Contributions are welcome.

## Setup

Use Node.js 20 or 22 and the npm version declared in `package.json`.

```bash
npm ci
npm run verify
```

## Pull Requests

1. Open an issue or discussion for substantial API or behavior changes.
2. Add tests for each new endpoint adapter or safety rule.
3. Keep the default profile read-only.
4. Verify endpoint contracts against current Onyx documentation or source.
5. Never log tokens, authorization headers, credentials, or private document content.
6. Run `npm run verify` before opening a pull request.

Commits use clear imperative messages. This project does not require a contributor license agreement. By contributing, you license your work under the repository's MIT license.

First-class tools should use stable Onyx APIs, strict input schemas, and clear descriptions of cost or side effects. Deployment-specific and unstable APIs belong behind `onyx_api_request` until their contracts are stable.
