# Releasing

Version tags create draft GitHub Releases through `.github/workflows/release.yml`. npm and MCP Registry publication are separate protected manual workflows so either registry can be retried safely.

## First Release Setup

1. Confirm ownership of the `@bywaleed` npm scope.
2. Bootstrap the package on npm if trusted publishing cannot be configured before the package exists.
3. Configure npm trusted publishing for repository `ByWaleed/onyx-mcp`, workflow `publish-npm.yml`, and environment `npm`.
4. Create the `npm` GitHub environment and restrict workflow dispatches to protected `main`.
5. Create an `mcp-registry` environment for official MCP Registry publishing.
6. Confirm GitHub Actions can obtain an npm OIDC identity without an `NPM_TOKEN` secret.

## Release Process

1. Update `CHANGELOG.md` and `package.json` using Semantic Versioning.
2. Run `npm run verify`, `npm run test:coverage`, and `npm pack`.
3. Merge through the protected `main` branch.
4. Create and push a signed `vX.Y.Z` tag matching `package.json`.
5. Verify the GitHub Release workflow creates a draft release with the tarball, checksum, SBOM, and build attestation.
6. Inspect the assets and publish the draft GitHub Release.
7. Run the `Publish GitHub Package` workflow from protected `main` for the tag.
8. Run the `Publish npm` workflow from protected `main` for the tag after trusted publishing is configured.
9. Run the `Publish MCP Registry` workflow from protected `main` after npm shows the exact version.

GitHub releases can be created before npm setup. Do not run the npm or MCP Registry workflows until their environments and external registry settings are configured.
