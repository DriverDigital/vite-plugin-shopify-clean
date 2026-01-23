# Publish Workflow

Instructions for releasing a new version of @driver-digital/vite-plugin-shopify-clean to npm.

## Prerequisites

- You must be on the `develop` branch with a clean working tree
- All changes intended for release must be committed to `develop`
- CI must be passing on `develop`

## Steps

### 1. Run integration test

Test the plugin in a real Shopify theme project to verify it works as expected.

**Test repository:** https://github.com/DriverDigital/sandbox-vite-plugin-shopify-clean

Clone the sandbox repo as a sibling directory, then run:

```bash
npm run test:sandbox
```

This script will:
1. Build and pack the plugin (cleans up old tarballs first)
2. Install it in the sandbox repo
3. Enable the plugin in vite.config.js
4. Clean assets and create fake stale files
5. Show assets **before** build (should include `-OLD` stale files)
6. Run `vite build`
7. Show assets **after** build (stale files should be removed)
8. Restore vite.config.js to its original state
9. Return to the plugin directory

**Verify:**
- The "before" list includes stale `-OLD` files
- The "after" list has no `-OLD` files
- Current build files are present
- No errors in console

**Do not proceed if any checks fail.**

### 2. Verify package integrity

Run the pre-publish verification to catch configuration issues before release:

```bash
npm run verify-package
```

This checks:
- Build succeeds
- All package.json export paths exist
- CJS and ESM imports work correctly
- TypeScript types compile
- Package contents are correct (npm pack)
- Configuration consistency (engines, extensions)

**Do not proceed if any checks fail.**

### 3. Analyze changes since last release

Compare `develop` to `main` to understand what's being released:

```bash
git fetch origin
git log origin/main..develop --oneline
git diff origin/main..develop --stat
```

Review the commits and changed files to categorize the release.

### 4. Check README.md is up to date

Perform a thorough review of `README.md` against the actual implementation in `src/index.ts` and `src/options.ts`. This is not a superficial check — read the source code and verify the README accurately describes how the plugin works.

**Checklist:**

- [ ] **Features section**: Each bullet point accurately describes current behavior
- [ ] **"How it works" section**: Technical descriptions match the actual `buildStart` and `writeBundle` implementations
- [ ] **Options section**: All options in `VitePluginShopifyCleanOptions` are documented with correct defaults
- [ ] **Usage example**: The example config is valid and shows current best practices
- [ ] **File types**: README mentions all file types the plugin tracks (check `getFilesInManifest` for JS, CSS, assets, etc.)
- [ ] **Cleanup mechanism**: README correctly describes how cleanup decisions are made (manifest comparison vs hash matching, etc.)

**If any discrepancies are found**, update the README and commit to `develop` before proceeding with the version bump.

### 5. Determine version bump type

Based on the changes, decide the version type:

| Type | When to use | Example |
|------|-------------|---------|
| `patch` | Bug fixes, documentation, internal refactors with no API changes | 1.0.2 → 1.0.3 |
| `minor` | New features that are backwards compatible | 1.0.2 → 1.1.0 |
| `major` | Breaking changes (API changes, removed features, changed defaults) | 1.0.2 → 2.0.0 |

### 6. Bump the version

Run the appropriate npm version command on `develop`:

```bash
npm version patch   # or minor, or major
```

This updates `package.json` and creates a git commit and tag automatically.

### 7. Update CHANGELOG.md

Add a new entry at the top of the changelog following the existing format:

```markdown
## X.Y.Z - YYYY-MM-DD - Brief description

- Change 1
- Change 2
```

Commit the changelog update:

```bash
git add CHANGELOG.md
git commit --amend --no-edit
git tag -f vX.Y.Z   # Re-tag to include changelog in the tagged commit
```

### 8. Push to develop

```bash
git push origin develop --tags
```

### 9. Merge to main

```bash
git checkout main
git pull origin main
git merge develop
git push origin main --tags
```

### 10. Create GitHub Release (required before npm publish)

**IMPORTANT: The GitHub Release must be created before publishing to npm.**

**Option A: Using GitHub CLI (recommended)**

```bash
gh release create vX.Y.Z --repo DriverDigital/vite-plugin-shopify-clean --title "vX.Y.Z" --notes "$(cat << 'EOF'
## Brief description

- Change 1
- Change 2
EOF
)"
```

Or to auto-generate notes from commits:

```bash
gh release create vX.Y.Z --repo DriverDigital/vite-plugin-shopify-clean --title "vX.Y.Z" --generate-notes
```

Note: The `--repo` flag is required because this repo has an `upstream` remote pointing to the original fork, which can confuse the `gh` CLI.

**Option B: Using GitHub UI**

Go to https://github.com/DriverDigital/vite-plugin-shopify-clean/releases/new

1. Choose the tag (e.g., `v1.0.3`)
2. Set the title (e.g., `v1.0.3`)
3. Copy release notes from CHANGELOG.md
4. Click "Publish release"

### 11. Publish to npm

**STOP: The user must complete this step.**

Once the user confirms they want to publish, tell them to open a new terminal and run:

```bash
npm login
npm publish
```

Authentication in the browser using a OTP will be requested.

Verify the release at: https://www.npmjs.com/package/@driver-digital/vite-plugin-shopify-clean

### 12. Return to develop

```bash
git checkout develop
```

## Notes

- The `npm version` command requires a clean git working tree
- Tags should follow the format `vX.Y.Z` (e.g., `v1.0.3`)
- Always verify CI passes before publishing
- If something goes wrong after `npm version` but before publish, you can reset with:
  ```bash
  git reset --hard HEAD~1
  git tag -d vX.Y.Z
  ```

## Alternative Testing Methods

These are fallback options if you need to test differently than the standard `npm run test:sandbox` workflow.

### Manual tarball testing

1. Build and pack the plugin:
   ```bash
   npm run build
   npm pack
   # Creates: driver-digital-vite-plugin-shopify-clean-X.Y.Z.tgz
   ```

2. In the test project, install the tarball:
   ```bash
   npm install /path/to/driver-digital-vite-plugin-shopify-clean-X.Y.Z.tgz
   ```

3. Run both build modes and verify cleanup works:
   ```bash
   # Production build - should clean old assets at buildStart
   vite build

   # Dev/watch mode - should clean stale assets on rebuild
   vite dev
   ```

### npm link (for rapid iteration)

```bash
# In this plugin directory
npm link

# In test project
npm link @driver-digital/vite-plugin-shopify-clean
```

Note: Symlinks can occasionally behave differently than real installs. Use `npm pack` for final verification.

### Testing dev/watch mode

```bash
cd ../sandbox-vite-plugin-shopify-clean
npm run dev
# Make changes to frontend files and verify stale assets are cleaned on rebuild
```
