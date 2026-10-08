# House standards

Shared across every Driver repo. In each repo with the `driver-kit` topic, the fleet wave installs
this file at `.github/claude-standards.md` beside the implementer and keeps it current (any other
repo copies it by hand); the repo's `CLAUDE.md` imports it with `@.github/claude-standards.md`. Edit
it in `DriverDigital/workflows` (`templates/github/claude-standards.md`), never in place. It carries style only — never permissions,
tool rules or hooks: on a pull request the implementer loads `CLAUDE.md` from the base branch but this
file from the PR head, so anything load-bearing belongs in `CLAUDE.md` or `.claude/`.

- **Commit messages** — Natural language, not strict conventional-commit formatting. Succinct: what
  changed, plus any rationale a senior developer would need later. No history, narratives, or
  who-decided-what.
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
  - *Say it once.* History and cross-cutting context live in `CLAUDE.md`; a mechanism is explained at
    the code that implements it, never replaced by a pointer; a rationale repeated within a file goes.
- **To-dos** — One-off to-dos are GitHub issues labelled `todo` on the repo they belong to. The
  driver-skills plugin lists a repo's open ones at session start, and its todo-capture skill files new
  ones, including cross-repo handoffs with a `from:` line. Close the issue when done. A gitignored
  `CLAUDE.local.md` is for private to-dos and personal capture only, never for work the team should
  see.
- **Branches and pull requests** — Macroscope reviews a pull request at most three times, and every
  push to an open PR spends one. A session works on one feature branch, commits each piece of work
  separately (even when they touch unrelated things) and pushes to the branch as often as it likes,
  then opens one PR at the end, when the work is ready for review. A PR needed sooner is a draft
  (Macroscope does not review drafts). Once a PR is open, collect fixes locally and push them
  together. PRs land with a merge commit, never a squash, so each commit survives on `main`.
  Deleting a head branch once its PR merges is preferred, but GitHub is not configured to do this on every repository, since some PR authors need to keep longer-lived branches in some repos: delete a branch you created for your own PR once it merges, and
  propose cleanup of other stale branches rather than deleting them.
- **`ponytail:` comments** — One line naming a ceiling someone could realistically hit (e.g. a
  hardcoded limit that mirrors a setting elsewhere, or an unpaginated cap). Other simplifications
  need no comment.
- **Subagents** — When delegating to subagents, use Haiku for classification, basic
  data entry and other simple tasks, Sonnet for easy, straightforward ones, and Opus for complex,
  lengthy or ambiguous ones. You remain responsible for quality and delivery.
- **Replies** — Lead with the answer or the next action. Build every sentence on a verb:
  "Move the file to `snippets/`", not "The file move to `snippets/` is the recommended step."
  Never turn an action into a noun ("the migration", "a refactor of the handler", "the file
  move") when a verb says it ("migrate", "refactor the handler", "move the file"); an engineer
  reads every reply at speed, and a sentence that hides its verb has to be decoded. One idea
  per sentence. Say what was done and what is left, once, without narrating the reasoning or
  restating the request. Code before prose, and a few lines after the code, not a paragraph.
