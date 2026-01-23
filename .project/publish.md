# Publish Workflow

Instructions for releasing a new version of @driver-digital/vite-plugin-shopify-clean to npm.

## Prerequisites

- You must be on the `develop` branch with a clean working tree
- All changes intended for release must be committed to `develop`
- CI must be passing on `develop`

## Steps

### 1. Verify package integrity

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

### 2. Analyze changes since last release

Compare `develop` to `main` to understand what's being released:

```bash
git fetch origin
git log origin/main..develop --oneline
git diff origin/main..develop --stat
```

Review the commits and changed files to categorize the release.

### 3. Check README.md is up to date

Perform a thorough review of `README.md` against the actual implementation in `src/index.ts` and `src/options.ts`. This is not a superficial check — read the source code and verify the README accurately describes how the plugin works.

**Checklist:**

- [ ] **Features section**: Each bullet point accurately describes current behavior
- [ ] **"How it works" section**: Technical descriptions match the actual `buildStart` and `writeBundle` implementations
- [ ] **Options section**: All options in `VitePluginShopifyCleanOptions` are documented with correct defaults
- [ ] **Usage example**: The example config is valid and shows current best practices
- [ ] **File types**: README mentions all file types the plugin tracks (check `getFilesInManifest` for JS, CSS, assets, etc.)
- [ ] **Cleanup mechanism**: README correctly describes how cleanup decisions are made (manifest comparison vs hash matching, etc.)

**If any discrepancies are found**, update the README and commit to `develop` before proceeding with the version bump.

### 4. Determine version bump type

Based on the changes, decide the version type:

| Type | When to use | Example |
|------|-------------|---------|
| `patch` | Bug fixes, documentation, internal refactors with no API changes | 1.0.2 � 1.0.3 |
| `minor` | New features that are backwards compatible | 1.0.2 � 1.1.0 |
| `major` | Breaking changes (API changes, removed features, changed defaults) | 1.0.2 � 2.0.0 |

### 5. Bump the version

Run the appropriate npm version command on `develop`:

```bash
npm version patch   # or minor, or major
```

This updates `package.json` and creates a git commit and tag automatically.

### 6. Update CHANGELOG.md

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

### 7. Push to develop

```bash
git push origin develop --tags
```

### 8. Merge to main

```bash
git checkout main
git pull origin main
git merge develop
git push origin main --tags
```

### 9. Create GitHub Release (required before npm publish)

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

### 10. Publish to npm

**STOP: The user must complete this step.**

Once the user confirms they want to publish, tell them to open a new terminal and run:

```bash
npm login
npm publish
```

Authentication in the browser using a OTP will be requested.

Verify the release at: https://www.npmjs.com/package/@driver-digital/vite-plugin-shopify-clean

### 11. Return to develop

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
