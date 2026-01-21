# @driver-digital/vite-plugin-shopify-clean

## 1.0.5 - 2026-01-21 - Dependency updates

- Update GitHub Actions (actions/setup-node 6.1.0 → 6.2.0).
- Update dev dependencies (@types/node, @typescript-eslint/eslint-plugin, @typescript-eslint/parser, vitest).

## 1.0.4 - 2026-01-21 - Fix CSS cleaning logic

- Fix CSS asset cleanup by replacing regex matching with manifest comparison.
- Add `safeUnlink` helper with proper error type handling.
- Track previous manifest files for accurate writeBundle cleanup.
- Add comprehensive integration tests with `it.each` pattern.
- Update dev dependencies (eslint, typescript, vite, tsup, @typescript-eslint/parser).

## 1.0.3 - 2025-12-09 - CI, testing, and tooling improvements

- Add CI workflow with linting, building, and testing across Node 18, 20, 22, 23.
- Add Vitest unit tests for `getFilesInManifest` and `resolveOptions`.
- Add GitHub Action to watch for upstream vite-plugin-shopify releases.
- Add LICENSE file with proper MIT attribution.
- Update dependabot configuration.
- Update dev dependencies.

## 1.0.2 - 2025-09-23 - README and docs updates

- Update README
- Update docs

## 1.0.1 - 2025-09-23 - Cleanup robustness and build-time cleaning

- Handle ENOENT during deletions to prevent crashes when files are already removed (race-safe) in `buildStart()` and `writeBundle()`.
- Run cleanup during production `vite build` (non-watch mode) to remove outdated hashed assets, not just during dev.
- Add warnings for non-ENOENT deletion errors instead of failing the build.

## 1.0.0 - 2025-09-22 - Initial Release

- Forked from [@by-association-only/vite-plugin-shopify-clean](https://github.com/dan-gamble/vite-plugin-shopify-clean)
- Upgraded all dependencies to latest
- Updated README
- Updated package.json
- removed pnpm
- added eslint
- use Rollup/Vite `this.meta.watchMode` (no need for `VITE_WATCH`).
- tightened hashed-filename regex to avoid false positives.
- scope first-run flags inside the plugin factory.
- compare by basename; underscore-prefixed entries detected via basename.
- use `fs.promises` consistently and replace `readFileSync` with async read.
- remove unused `chokidar`, `fast-glob`, `lodash` from dependencies.

