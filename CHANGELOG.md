# @driver-digital/vite-plugin-shopify-clean

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

