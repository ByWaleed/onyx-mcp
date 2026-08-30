# Releasing

Releases use npm trusted publishing from `.github/workflows/release.yml`.

## First Release Setup

1. Confirm ownership of the `@bywaleed` npm scope.
2. Bootstrap the package on npm if trusted publishing cannot be configured before the package exists.
3. Configure npm trusted publishing for repository `ByWaleed/onyx-mcp`, workflow `release.yml`, and environment `npm`.
4. Create the `npm` GitHub environment and restrict deployment to version tags.
5. Confirm GitHub Actions can obtain an npm OIDC identity without an `NPM_TOKEN` secret.

## Release Process

1. Update `CHANGELOG.md` and `package.json` using Semantic Versioning.
2. Run `npm run verify`, `npm run test:coverage`, and `npm pack`.
3. Merge through the protected `main` branch.
4. Create and push a signed `vX.Y.Z` tag matching `package.json`.
5. Verify the Release workflow publishes with provenance and creates the GitHub release.

Do not push a release tag until npm trusted publishing is configured.
