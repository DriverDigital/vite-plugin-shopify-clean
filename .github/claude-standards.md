# House standards

Shared across every Driver repo. In each repo with the `driver-kit` topic, the fleet wave installs
this file at `.github/claude-standards.md` and keeps it current (any other
repo copies it by hand); the repo's `CLAUDE.md` imports it with `@.github/claude-standards.md`. Edit
it in `DriverDigital/workflows` (`templates/github/claude-standards.md`), never in place. It carries style only — never permissions,
tool rules or hooks: on a pull request the implementer loads `CLAUDE.md` from the base branch but this
file from the PR head, so anything load-bearing belongs in `CLAUDE.md` or `.claude/`.

- **Commit messages** — Natural language, not strict conventional-commit formatting. Succinct: what
  changed, plus any rationale a senior developer would need later. No history, narratives, or
  who-decided-what.
- **Commit authorship** — Commits carry the name and email of the person running the session, so the
  team can see who worked on a repo or PR. No `Co-Authored-By` trailer. A cloud session's git identity
  is Claude, so set both on each commit and turn signing off:
  `git -c user.name="<name>" -c user.email="<email>" -c commit.gpgsign=false commit …`. The session
  signs with Anthropic's key, which GitHub marks Unverified under a person's name. Ask for the name and
  email if you don't have them. The implementer's issue runs are the exception: they commit as
  `claude[bot]`.
- **Code comments** — Code should be self-describing; comments are written as one senior engineer to
  another. A comment is either a *guidebook* (what this is, where it is used, how it works, what it is
  bound to) or *provenance* (which Figma frame, which ticket, which date, who decided). Guidebooks
  stay; provenance never goes in code.
  - *Wayfinding stays.* A one-line label naming a region (`{% comment %} Products {% endcomment %}`,
    `<!-- Reviews app -->`, `/* Mobile */`), a bare ownership tag on a block we wrote inside a
    third-party file, Start/End markers around an app's script, and banners between a file's parts.
    They may restate the code; that is their job. Drop one only when it repeats the header for the
    same region.
  - *Headers are guidebooks.* Every section and non-trivial file opens with one: what it renders and
    where it is used, how it works when that is not obvious, the metaobjects and metafields that feed
    it, the file on the other side of a binding, one line per param. Length follows complexity. Keep
    an existing header whole and strip only its provenance lines; give a file without one a header.
  - *Explanation earns its lines.* Only where the code does not show it: a coupling, an ordering or
    timing constraint, a cascade trick, a unit gloss like `/* 11px */`. Two or three full sentences.
    When compressing, keep the subject (the app or component), both ends of a coupling, and every
    step of a trade-off; never swap in a slogan or absorb a neighbouring label. Do not reword a
    comment that already fits.
  - *Third-party code keeps its comments* as the app or vendor wrote them, junior ones included, so
    it stays diffable against the source.
  - *Disabled code is a code call.* Commented-out markup and debug blocks, with their reason line,
    stay until a code change removes them.
  - *Say it once.* Cross-cutting context lives in `CLAUDE.md`, and history in git and the PRs; a
    mechanism is explained at the code that implements it, never replaced by a pointer; a rationale
    repeated within a file goes.
- **To-dos** — One-off to-dos are GitHub issues labelled `todo` on the repo they belong to. The
  driver-skills plugin lists a repo's open ones at session start, and its todo-capture skill files new
  ones, including cross-repo handoffs with a `from:` line. Close the issue when done. A gitignored
  `CLAUDE.local.md` is for private to-dos and personal capture only, never for work the team should
  see.
- **`docs/HANDOFF.md`** — The current state only, rewritten in place each session, never a dated
  log: what is in flight, what is blocked, what is next, and which decisions are open. It points at
  open `todo` issues rather than repeating them. It never holds dated session entries, verification
  records, run ids, completed work, or who decided what; git and the PRs keep that history. A fact
  that stays true and needed (an account, a secret's home, an operating step) moves to the doc that
  owns it, such as `CLAUDE.md` or `README.md`.
- **Docs ship with the change** — A pull request carries every doc update its change makes
  necessary, in the same PR, never in a later pass. Do this without being asked. Before opening a PR,
  pushing to one, merging or wrapping up, search the repo's docs for what the change touched and
  update, in place, each one the change made untrue: `CLAUDE.md` when a convention or invariant
  moved, a README, `docs/HANDOFF.md`, or any other doc. Delete a statement that stopped being true;
  never append a correction beneath it. Leave old reference docs in `docs/` as they are unless the
  change makes them misleading for current work. A doc in another repo gets a `todo` issue there
  instead of an edit.
- **Branches and pull requests** — Macroscope reviews a pull request at most three times, every
  push to a published PR spends one, and it does not review drafts. A session works on one feature
  branch, commits each piece of work separately (even when they touch unrelated things) and pushes
  to the branch as often as it likes, then opens one PR at the end as a draft (`gh pr create
  --draft`). It never marks the PR ready for review: the person running the session publishes it, or
  says to, once they have reviewed it. Once a PR is published, collect fixes locally and push them
  together. One exception, for an org admin, who can bypass branch protection: a minor docs-only
  change may go straight to `main` when no feature branch is open, or when it concerns `main` and not
  the branch's work; anyone else opens a PR for it. When the session's work is on a
  feature branch, its docs updates, the end-of-session `docs/HANDOFF.md` included, are committed to
  that branch and ride in its PR. A docs change that alters how the repo is understood or how future
  work is done, or spans many files, always goes in a PR, so its conflicts and contradictions get
  reviewed. The implementer's issue runs open a published PR, since Macroscope's review and the
  revise loop run unattended. PRs land with a merge commit, never a squash, so each commit survives on `main`.
  Deleting a head branch once its PR merges is preferred, but GitHub is not configured to do this on every repository, since some PR authors need to keep longer-lived branches in some repos: delete a branch you created for your own PR once it merges, and
  propose cleanup of other stale branches rather than deleting them.
- **Comments on a pull request** — A review or comment posted on a PR @mentions its author once, in
  the review summary or the comment body, not in each inline comment, so the author is notified.
- **Closing issues** — In a PR body or commit message, give each issue its own keyword: `Closes #1,
  closes #2`, never `Closes #1, #2`. GitHub closes only the issue right after a keyword, and the
  kit's `close-linked-issues.yml` reads `main-*` merges the same way.
- **Theme editor changes on a PR preview** — On a Shopify theme repo, a branch with an open PR has a
  preview theme `DRIVER/<branch>` (a name over 50 characters is shortened, so find it with `shopify
  theme list`), unless the PR changes no theme files. Every push re-uploads the whole theme and
  overwrites anything changed in that theme's editor, so before pushing, pull `templates/*.json`,
  `sections/*.json` and `config/settings_data.json` from the preview into a scratch folder. Where a
  file differs from the last pushed commit and the branch has not changed it since, take the preview's
  version and commit it ("Pull theme editor changes"). Where both changed, stop and ask. Skip this
  when the CLI has no access to the store, and say so.
- **Figma designs on a PR** — When a PR implements a Figma design, put the design link in its
  description and add the `figma` label (`gh pr create --label figma`, or `gh pr edit <n> --add-label
  figma`): Macroscope runs its design fidelity check only on PRs with that label. If you cannot add
  it, tell the person to. The check reads a link in the PR description only when an organisation
  member opened the PR; the implementer's link counts through its issue. For anyone else, put the
  link on the Bonsai ticket.
- **Client team memory** — A client repo's `CLAUDE.md` links the client's folder in the Clients
  shared drive, where driver-skills' `team-memory` keeps the client's CLAUDE, HANDOFF, MEMORY and
  ARTIFACTS docs; each repo adds its own link. Read them for client context when useful. When a
  session produces something the team needs before the next client meeting (what is ready to deploy,
  which PRs wait for review), add it to that HANDOFF doc with `team-memory`; without the Google Drive
  and Docs connectors, tell the person what to add. The implementer's issue runs skip this.
- **`ponytail:` comments** — One line naming a ceiling someone could realistically hit (e.g. a
  hardcoded limit that mirrors a setting elsewhere, or an unpaginated cap). Other simplifications
  need no comment.
- **Subagents** — When delegating to subagents, use Haiku for classification, basic
  data entry and other simple tasks, Sonnet for easy, straightforward ones, and Opus for complex,
  lengthy or ambiguous ones. You remain responsible for quality and delivery.
- **Replies** — Keep responses focused, brief, and clear, using plain, literal English. Lead with
  the answer or the next action. Build every sentence on a verb:
  "Move the file to `snippets/`", not "The file move to `snippets/` is the recommended step."
  Never turn an action into a noun ("the migration", "a refactor of the handler", "the file
  move") when a verb says it ("migrate", "refactor the handler", "move the file"); an engineer
  reads every reply at speed, and a sentence that hides its verb has to be decoded. One idea
  per sentence. Say what was done and what is left, once, without narrating the reasoning or
  restating the request. Code before prose, and a few lines after the code, not a paragraph.
