# Handoff

Current state only. Conventions live in `CLAUDE.md`; to-dos are open `todo` issues.

## In flight

- **3.0.0 is ready to release from `main`.** It drops Node 20 (now `>=22.12.0`, matching Barrel's `vite-plugin-shopify` 5), deletes each removed asset's `.map`, and updates dev dependencies (tsup 9, vitest 5). Cut it with `docs/publish.md`; the CHANGELOG entry is written at release time. Run `test:sandbox` after the sandbox repo's `vite8-sourcemaps` PR merges, since that is what covers the `.map` cleanup.

## Waiting on something outside this repo

- **TypeScript 7 (#103)** waits for @typescript-eslint to support it. 8.73.0 still declares `typescript <6.1.0`.
- `.github/dependabot.yml` still ignores vitest majors; the ignore is removed in DriverDigital/workflows#164 and arrives with the next kit wave.

## Open decisions

- Repo hardening that needs a closer look: a read-only default workflow token (#126), and npm trusted publishing with provenance (#127).
- Secret scanning, push protection and CodeQL default setup are on for this repo (free because it's public).
