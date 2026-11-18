# Handoff

Current state only. Conventions live in `CLAUDE.md`; to-dos are open `todo` issues.

## Next: release 3.0.0

Everything for 3.0.0 is merged to `main`. The next session releases it:

1. Pull `main` here and in the sibling `sandbox-vite-plugin-shopify-clean` checkout, then run `npm ci` in both.
2. Run `npm run test:sandbox`. It fails on its own if any stale `-OLD` file, `.map` files included, survives the build.
3. Follow `docs/publish.md` from step 2 (`verify-package`) through the GitHub release. The user runs `npm publish`.

What 3.0.0 contains, for the CHANGELOG:
- **Breaking:** requires Node `>=22.12.0` (Node 20 dropped), matching Barrel's `vite-plugin-shopify` 5.
- Each deleted asset's sourcemap (`<file>.map`) is now deleted with it.
- Dev dependencies updated (tsup 9, vitest 5, typescript-eslint 8.73); clears the minimatch alert.
- `watch-upstream.yml` works again, and the workflows declare least-privilege permissions.
- `npm audit` still reports picomatch (dev-only, no patched release yet); `npm audit --omit=dev` is clean, so don't call the audit clean.

## Waiting on something outside this repo

- **TypeScript 7 (#103)** waits for @typescript-eslint to support it. 8.73.0 still declares `typescript <6.1.0`.
- `.github/dependabot.yml` still ignores vitest majors; the ignore is removed in DriverDigital/workflows#164 and arrives with the next kit wave.

## Open decisions

- Repo hardening that needs a closer look: a read-only default workflow token (#126), and npm trusted publishing with provenance (#127).
- Secret scanning, push protection and CodeQL default setup are on for this repo (free because it's public).
- Two stale remote branches could be deleted: `remove-pipeline-kit-files` (#122 merged) and `dependabot/npm_and_yarn/other-dependencies-77dc0460b0`.
