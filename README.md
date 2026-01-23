# @driver-digital/vite-plugin-shopify-clean

Vite plugin that cleans up your Shopify theme `assets/` folder across builds and during watch (HMR). It is designed to be used alongside Barrel's [Shopify Vite Plugin](https://shopify-vite.barrelny.com/).

Why you might need this: when Vite emits hashed filenames (e.g., `app-abc123.js`), older hashed files can accumulate over time. This plugin removes outdated assets safely so your `assets/` directory stays tidy and your theme only references current files.

[GitHub](https://github.com/DriverDigital/vite-plugin-shopify-clean)

[npm](https://www.npmjs.com/package/@driver-digital/vite-plugin-shopify-clean)

[Issues](https://github.com/DriverDigital/vite-plugin-shopify-clean/issues)

[Changelog](https://github.com/DriverDigital/vite-plugin-shopify-clean/blob/main/CHANGELOG.md)

## Features

- Cleans pre-existing assets listed in the last manifest at the start of a build.
- Removes stale assets after each build by comparing the previous manifest to the current one — in both dev (watch) and production builds.
- Tracks JS, CSS, and asset files (images, fonts, etc.) from the manifest.
- Uses Rollup/Vite `watchMode` (no env var required) to control watch-specific behavior.
- Works with the Shopify theme assets directory structure.
- Minimal configuration; sensible defaults.

## Installation

```bash
npm i -D @driver-digital/vite-plugin-shopify-clean
```

Peer requirements:

- Node.js: `>=18`
- Vite: `>=5`

## Usage

Add the plugin to your Vite config alongside Barrel's [Shopify Vite Plugin](https://shopify-vite.barrelny.com/).

```js
// vite.config.js
import { defineConfig } from 'vite'
import shopify from 'vite-plugin-shopify'
import shopifyClean from '@driver-digital/vite-plugin-shopify-clean'

export default defineConfig({
  build: {
    emptyOutDir: false,
    sourcemap: true
  },
  plugins: [
    shopifyClean({
      // themeRoot: './',
      // manifestFileName: '.vite/manifest.json',
    }),
    shopify({
      tunnel: true,
      themeRoot: ".",
      sourceCodeDir: "frontend"
    })
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

The plugin tracks files listed in Vite's manifest (JS, CSS, and asset files like images and fonts) and uses manifest comparison to determine what to clean.

- Build start (`buildStart`)
  - If `assets/.vite/manifest.json` exists (or your configured path), the plugin reads the previously emitted assets and removes them from `assets/` before a fresh build. This prevents stale files from lingering across builds.
- Write bundle (`writeBundle`)
  - After new assets are written, the plugin compares the previous manifest to the current one. Any files that were in the old manifest but are no longer in the new manifest are deleted. This handles cases where entry points are renamed or removed between builds.

## Changelog

See [CHANGELOG.md](https://github.com/DriverDigital/vite-plugin-shopify-clean/blob/main/CHANGELOG.md) for release notes.

## License

MIT

## Acknowledgements

Built and maintained with ♥️ by [Driver Digital](https://www.driver-digital.com) 

Originally forked from [@by-association-only/vite-plugin-shopify-clean](https://github.com/dan-gamble/vite-plugin-shopify-clean) - big thanks to [Dan Gamble](https://github.com/dan-gamble) for his work on the original.
