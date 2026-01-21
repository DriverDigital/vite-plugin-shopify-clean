# Publish Workflow

Instructions for releasing a new version of @driver-digital/vite-plugin-shopify-clean to npm.

## Prerequisites

- You must be on the `develop` branch with a clean working tree
- All changes intended for release must be committed to `develop`
- CI must be passing on `develop`

## Steps

### 1. Analyze changes since last release

Compare `develop` to `main` to understand what's being released:

```bash
git fetch origin
git log origin/main..develop --oneline
git diff origin/main..develop --stat
```

Review the commits and changed files to categorize the release.

### 2. Check README.md is up to date

Review `README.md` against the current codebase to ensure documentation reflects any new features, changed options, or updated usage patterns included in this release.

### 3. Determine version bump type

Based on the changes, decide the version type:

| Type | When to use | Example |
|------|-------------|---------|
| `patch` | Bug fixes, documentation, internal refactors with no API changes | 1.0.2 � 1.0.3 |
| `minor` | New features that are backwards compatible | 1.0.2 � 1.1.0 |
| `major` | Breaking changes (API changes, removed features, changed defaults) | 1.0.2 � 2.0.0 |

### 4. Bump the version

Run the appropriate npm version command on `develop`:

```bash
npm version patch   # or minor, or major
```

This updates `package.json` and creates a git commit and tag automatically.

### 5. Update CHANGELOG.md

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

### 6. Push to develop

```bash
git push origin develop --tags
```

### 7. Merge to main

```bash
git checkout main
git pull origin main
git merge develop
git push origin main --tags
```

### 8. Create GitHub Release (required before npm publish)

**IMPORTANT: The GitHub Release must be created before publishing to npm.**

**Option A: Using GitHub CLI (recommended)**

```bash
gh release create vX.Y.Z --title "vX.Y.Z" --notes "$(cat << 'EOF'
## Brief description

- Change 1
- Change 2
EOF
)"
```

Or to auto-generate notes from commits:

```bash
gh release create vX.Y.Z --title "vX.Y.Z" --generate-notes
```

**Option B: Using GitHub UI**

Go to https://github.com/DriverDigital/vite-plugin-shopify-clean/releases/new

1. Choose the tag (e.g., `v1.0.3`)
2. Set the title (e.g., `v1.0.3`)
3. Copy release notes from CHANGELOG.md
4. Click "Publish release"

### 9. Publish to npm

**STOP: The user must complete this step.**

Once the user confirms they want to publish, tell them to open a new terminal and run:

```bash
npm publish
```

Authentication in the browser using a OTP will be requested.

Verify the release at: https://www.npmjs.com/package/@driver-digital/vite-plugin-shopify-clean

### 10. Return to develop

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
