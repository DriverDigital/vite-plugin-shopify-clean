# Handoff

Current state only. Conventions live in `CLAUDE.md`; to-dos are open `todo` issues.

## Released

3.0.0 is on npm and GitHub. Nothing is in flight.

## Waiting on something outside this repo

- **TypeScript 7 (#103)** waits for @typescript-eslint to support it. 8.73.0 still declares `typescript <6.1.0`.
- `.github/dependabot.yml` still ignores vitest majors; the ignore is removed in DriverDigital/workflows#164 and arrives with the next kit wave.
- `npm audit` still reports picomatch (dev-only, no patched release yet); `npm audit --omit=dev` is clean.

## Open decisions

- Repo hardening that needs a closer look: a read-only default workflow token (#126), and npm trusted publishing with provenance (#127).
- Secret scanning, push protection and CodeQL default setup are on for this repo and the sandbox repo (free because both are public).
