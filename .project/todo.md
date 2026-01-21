# Todo

## Completed

### Issue #14: Clean CSS - FIXED

**URL:** https://github.com/DriverDigital/vite-plugin-shopify-clean/issues/14

Fixed `getFilesInManifest` to extract CSS files from manifest entries. The function now includes `block.css` arrays in addition to `block.file`.

### Issue #15: writeBundle regex logic - FIXED

**URL:** https://github.com/DriverDigital/vite-plugin-shopify-clean/issues/15

Replaced flawed regex-based approach with manifest comparison:
- `buildStart` now stores previous manifest files
- `writeBundle` compares previous vs current manifest files
- Deletes files that were in previous but not current manifest

This is more reliable than regex matching and works with all filename formats.

### Bug fixes included:
- TOCTOU race condition removed (no more `existsSync` before `unlink`)
- `any` type replaced with `unknown` + proper type guards
- Added `safeUnlink` helper function for consistent error handling

### Issue #13: Upstream release compatibility - VERIFIED

**URL:** https://github.com/DriverDigital/vite-plugin-shopify-clean/issues/13

Reviewed vite-plugin-shopify@4.1.1 release notes:
- Patch release with no breaking changes
- Fixed modulepreload tag generation bug
- Updated dependencies

No changes needed to this plugin. Compatibility verified.

### tsconfig.json module mismatch - FIXED

Updated `tsconfig.json`:
- Changed `target` from `es2016` to `es2022`
- Changed `module` from `commonjs` to `ESNext`
- Added `moduleResolution: "bundler"` for proper module resolution

The config now reflects the actual ESM module system used by the project.

### Integration test coverage - FIXED

Added comprehensive integration tests for plugin hooks:

**`buildStart` tests:**
- Deletes files listed in existing manifest on first run
- Warns when assets folder does not exist
- Warns when manifest file does not exist
- Skips deletion on subsequent runs in watch mode
- Handles files that no longer exist gracefully

**`writeBundle` tests:**
- Deletes files removed from manifest between builds
- Skips deletion on first run in watch mode
- Returns early if manifest not in bundle
- Handles CSS files correctly

Tests use real filesystem operations with temp directories for accurate integration testing.
