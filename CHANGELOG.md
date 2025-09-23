# @driver-digital/vite-plugin-shopify-clean

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

