# @driver-digital/vite-plugin-shopify-clean

Vite plugin that correctly cleans up your Shopify theme `assets/` folder across builds and during watch (HMR). It is designed to be used alongside Barrel's [Shopify Vite Plugin](https://shopify-vite.barrelny.com/).

Why you might need this: when Vite emits hashed filenames (e.g., `app-abc123.js`), older hashed files can accumulate over time. This plugin removes outdated assets safely so your `assets/` directory stays tidy and your theme only references current files.

## Features

- Cleans pre-existing assets listed in the last manifest at the start of a build.
- In watch mode, removes prior hashed variants when a new hashed file is written.
- Uses Rollup/Vite `watchMode` (no env var required) to control watch-specific behavior.
- Works with the Shopify theme assets directory structure.
- Minimal configuration; sensible defaults.

## Installation

```bash
npm i -D @driver-digital/vite-plugin-shopify-clean
```

Peer requirements:

- Node.js: `>=18`
- Vite: `^5` through latest

## Usage

Add the plugin to your Vite config alongside Barrel's [Shopify Vite Plugin](https://shopify-vite.barrelny.com/).

```js
// vite.config.mjs
import { defineConfig } from 'vite'
import shopify from 'vite-plugin-shopify'
import cleanup from '@driver-digital/vite-plugin-shopify-clean'

export default defineConfig({
  build: {
    emptyOutDir: false,
    sourcemap: true,
  },
  plugins: [
    cleanup({
      // themeRoot: './',
      // manifestFileName: '.vite/manifest.json',
    }),
    shopify({
      snippetFile: 'vite.liquid',
    }),
  ],
})
```

Notes:

- When outputting directly to your Shopify theme `assets/` folder, set `build.emptyOutDir: false`. The plugin relies on the previous build's files and manifest to determine what to remove. If Vite empties the directory first, there is nothing to compare and the cleanup cannot run as intended (and you generally don't want Vite to wipe your theme assets).
- The plugin expects a Vite manifest to exist within your theme `assets/` directory (by default at `assets/.vite/manifest.json`). If your integration writes the manifest elsewhere, configure `manifestFileName` or `themeRoot` accordingly.
- In watch mode, the plugin automatically handles cleanup as new files are emitted.

## Options

```ts
interface VitePluginShopifyCleanOptions {
  /**
   * Relative location of the manifest inside the theme's assets directory.
   * Defaults to `.vite/manifest.json` (resolved under `assets/`).
   */
  manifestFileName?: string

  /**
   * Shopify theme root directory (relative to project root).
   * Defaults to `./`.
   */
  themeRoot?: string
}
```

Defaults used by the plugin:

- `manifestFileName`: `.vite/manifest.json`
- `themeRoot`: `./`

## How it works

- Build start (`buildStart`)
  - If `assets/.vite/manifest.json` exists (or your configured path), the plugin reads the previously emitted assets and removes them from `assets/` before a fresh build. This prevents stale files from lingering across builds.
- Write bundle (`writeBundle`, watch mode only)
  - After new assets are written, the plugin identifies older hashed variants of files (same base name, different hash) in `assets/` and removes those. This keeps only the current hashed files per entry.

Implementation details for safety and compatibility:

- Uses `this.meta.watchMode` to detect watch mode (no `process.env` checks required).
- Matches hashed variants with a precise, anchored regex (`^name-[^.]+\.ext$`) to avoid false positives.
- Compares manifest entries and on-disk files by basename to avoid path mismatches.
- Treats underscore-prefixed manifest keys (e.g., `_partial.scss`) conservatively, only including them if referenced by other entries.
- Uses Node’s async `fs.promises` APIs.

## Limitations and expectations

- Your build should produce a Vite manifest accessible under the theme `assets/` directory (e.g., `assets/.vite/manifest.json`). If your Shopify integration writes it to a different location, adjust `manifestFileName` and/or `themeRoot`.
- The cleanup logic assumes hashed filenames follow a `name-hash.ext` convention (the default behavior for Vite’s hashed output).

## Troubleshooting

- "No assets folder located" warning:
  - Ensure `themeRoot` points to the root of your Shopify theme and that an `assets/` directory exists.
- "No manifest" warning:
  - Ensure your Vite build emits a manifest in `assets/` (or adjust `manifestFileName`). Many Shopify + Vite integrations copy or emit the manifest into your theme assets.

## Changelog

See `CHANGELOG.md` for release notes.

## License

MIT

## Acknowledgements

Originally forked from [@by-association-only/vite-plugin-shopify-clean](https://github.com/dan-gamble/vite-plugin-shopify-clean) and modernized for current Vite + Shopify workflows.
