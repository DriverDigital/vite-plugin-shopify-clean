# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A published npm package (`@driver-digital/vite-plugin-shopify-clean`) — a single Vite plugin that removes stale hashed assets from a Shopify theme's `assets/` folder. It's a maintained fork of `@by-association-only/vite-plugin-shopify-clean` and is meant to run alongside Barrel's `vite-plugin-shopify`. The entire implementation is `src/index.ts` + `src/options.ts`; everything else is build, test, release, and CI scaffolding.

## Commands

```bash
npm run build          # tsup → dist/ (cjs + esm + .d.ts), --clean wipes dist first
npm run watch          # build in watch mode
npm run lint           # eslint src --fix
npm test               # vitest run (all tests)
npm run test:watch     # vitest in watch mode
npm run verify-package # full pre-publish gate (see below) — run before any release
npm run test:sandbox   # integration test against a real theme (see below)
```

Run a single test file or case:

```bash
npx vitest run src/index.test.ts
npx vitest run -t "deletes files removed from manifest"   # by test name
```

CI (`.github/workflows/ci.yml`) runs lint → build → test on Node 20/22/24, and **only triggers on `main`**.

## Architecture

The plugin decides what to delete by **comparing Vite manifests across builds** — never by regex-matching hashed filenames (an earlier regex approach was removed in 1.0.4; don't reintroduce it). All cleanup keys off files listed in the manifest, compared by `path.basename`.

Two hooks, both defined in `src/index.ts`:

- **`buildStart`** — reads the *previous* build's manifest from disk (`assets/.vite/manifest.json` by default) and deletes those files, so a fresh build doesn't leave last build's hashed assets behind. It also seeds `previousManifestFiles` for the writeBundle diff.
- **`writeBundle`** — reads the *current* manifest out of the Rollup bundle, diffs it against `previousManifestFiles`, and deletes anything that dropped out (entry renamed/removed). Then updates `previousManifestFiles` for the next rebuild.

State that makes this work correctly:

- `buildStartFirstRun` / `writeBundleFirstRun` and `previousManifestFiles` are **closure variables scoped per plugin instance** (declared inside the `shopifyClean()` factory, not module-level). This is deliberate — module-level state leaks across builds. Keep new state inside the factory.
- Watch-mode behavior is gated on `this.meta.watchMode` (Rollup/Vite native) — there is no `VITE_WATCH` env var. In watch mode, `buildStart` only deletes on the first run and `writeBundle` skips its first run, so an initial dev build doesn't nuke assets it's about to re-emit.

`getFilesInManifest` (exported, unit-tested directly) flattens a manifest into files to track: each entry's `file`, plus its `css[]` and `assets[]` arrays. Underscore-prefixed entries (`_shared.ts`) are **excluded unless they're imported by another entry** — orphaned `_`-chunks are skipped. When touching this function, preserve that import-reachability rule; the test `excludes underscore-prefixed chunks unless imported` covers it.

Deletion always goes through `safeUnlink`, which swallows `ENOENT` (file already gone — no TOCTOU `existsSync` check) and warns-but-doesn't-throw on any other error, so cleanup never fails a build.

## Options

Resolved in `src/options.ts` with defaults `manifestFileName: '.vite/manifest.json'` and `themeRoot: './'`. `manifestFileName` is resolved *under* `<themeRoot>/assets/`. Consumers must set `build.emptyOutDir: false` (documented in README) — otherwise Vite wipes the dir and there's no previous state to diff.

## Release / branching

- **`main`-only flow.** PRs (features, deps) merge into `main`; releases are cut from `main`. The `develop` branch still exists on origin but is **intentionally dormant** — don't target it, don't delete it, don't reintroduce it into workflows or config.
- Full release procedure lives in `.project/publish.md` — follow it step by step. `npm run verify-package` (checks build, export paths, CJS+ESM imports, type compilation, `npm pack` contents, engine/extension consistency) and `npm run test:sandbox` (packs the plugin, installs into a sibling `../sandbox-vite-plugin-shopify-clean` checkout, simulates stale files, runs a real `vite build`, confirms they're gone) are both gates before publishing. `npm publish` itself is run by the user.
- This repo has an `upstream` remote pointing at the original fork, which confuses `gh` — always pass `--repo DriverDigital/vite-plugin-shopify-clean` to `gh release` commands.
