# Handoff

State of play as of 2026-10-06. Conventions live in `CLAUDE.md`; to-dos are open `todo` issues.

## Where things are

- **2.0.2 is published** to npm (`latest`) and has a GitHub release. It contains only dev-dependency updates and README fixes.
- **Nothing is in flight.** `main` is clean, there are no open PRs, and `develop` and `.project/todo.md` are gone.

## Waiting on something outside this repo

- **TypeScript 7 (#103)** waits for @typescript-eslint to support it. As of 2026-10-06, 8.71.1 still declares `typescript <6.1.0`.
- **Dropping Node 20 (#117)** waits for Vite to drop it. The trigger is a Dependabot PR for a Vite release whose `engines` exclude Node 20, most likely Vite 9. That change ships as 3.0.0 and includes vitest 5.
- **Node 26 (#109)** is scheduled for Q1 2027 as part of the org-wide sweep. It adds Node 26 only; it doesn't drop Node 20.
- **DriverDigital/workflows#81:** confirm that the CI implementer loads the `@.github/claude-standards.md` import on this repo's next `claude.yml` run.

`dependabot.yml` ignores typescript and vitest major versions until #103 and #117 land, so no Dependabot PRs for those majors will appear.

## Ready to pick up

- #110: three test gaps in `src/index.test.ts`
- #114: clean stale sourcemap (`.map`) files. Remove the README caveat when this is done.
