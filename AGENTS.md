# AGENTS.md — Quick Answer

## Product and stack
- Edge MV3 browser extension, plain HTML/CSS/JavaScript, zero npm/runtime dependencies.
- Optional local Node.js companion for Codex authentication; not needed for Groq/Gemini.
- Working commands: `node scripts/check-release.mjs`; load `edge-quick-answer` via `edge://extensions`. No administrator rights in the standard path.
- Directories: `edge-quick-answer` runtime, `docs` multilingual guides and release notes, `scripts` static validation, `.github` CI/issue template.

## Workflow
1. On `Sxx реализовываем`, read this file, `roadmap.md`, `current_task.md`, inspect `git status` and affected code. Recommend reasoning effort, do not claim to change it yourself.
2. Implement **only that stage**, with relevant checks. Update the two tracking files at meaningful points. End with results, actual tests, limitations, usage if available (otherwise `н/д`), suggested commit `Sxx: ...`, and next stage.
3. Status: TODO, IN_PROGRESS, REVIEW, BLOCKED, DONE. Do not claim DONE for Windows/Edge-specific acceptance while Windows Edge cannot be tested. Never weaken tests to make CI green.
4. Preserve existing command IDs and config/storage keys to avoid losing users' hotkeys and secrets. Never share account data.
5. No commit, push, pull request, release, public repo creation, site publication or deployment without an explicit instruction. No destructive git clean/reset/force without separate approval.
6. Token accounting: only native measured usage scoped to this stage; otherwise `н/д`. Do not fabricate or convert token use to plan quota.
7. Never commit API keys, backups, diagnostic screenshots, real quiz content, session logs or installed browser profiles. User backup JSON is not a release asset.

## Rules
- No API keys hardcoded. Use local Edge storage; encrypted backups only on user action. External model providers have independent quotas and terms.
- Keep RU/DE/EN synchronized across runtime UI and documentation. Test i18n dictionary key parity.
- All screenshots in published docs use synthetic data and are labeled.
- Distinguish static/browser simulation tests from actual real Windows/Edge/AI provider verification.
- Do not invent results, downloads, license status or provider performance.

## Approved UI design (required)

**Before editing popup, settings, screenshots or GitHub Pages**, read [`DESIGN_FREEZE.md`](DESIGN_FREEZE.md) and inspect the three approved references under `docs/design/`. This is the user's confirmed Orange Pulse visual direction: orange lightning icon, dark navy base, orange accents, compact popup, readable settings dashboard, matching RU/DE/EN docs. Do not revive the cyan-dominant neon theme. Preserve real hotkeys and APIs even where concept illustrations show placeholder controls.
