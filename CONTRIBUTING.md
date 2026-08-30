# Contributing

Contributions are welcome.

1. Open an issue for substantial API or behavior changes.
2. Add tests for each new endpoint adapter or safety rule.
3. Keep the default profile read-only.
4. Never log tokens, authorization headers, credentials, or private document content.
5. Run `npm run check`, `npm test`, and `npm run build` before opening a pull request.

First-class tools should use stable Onyx APIs, strict input schemas, and clear descriptions of cost or side effects. Deployment-specific and unstable APIs belong behind `onyx_api_request` until their contracts are stable.
