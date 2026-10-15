# Quick Answer — Approved Design Freeze · Orange Pulse (S04)

This is the canonical visual specification for Quick Answer. Read this file and the three approved mockup images **before** UI work in a new chat or repository session.

## Approved concept images

- [Popup, approved concept illustration](docs/design/approved-popup-concept.png)
- [Settings, approved concept illustration](docs/design/approved-settings-concept.png)
- [Website and docs, approved concept illustration](docs/design/approved-site-concept.png)

These are **AI-generated concept renders**, not screenshots of the executable UI. Some labels, shortcuts, model examples, and displayed metrics are illustrative and differ from the functional implementation. Recreate their **visual hierarchy and spacing** as closely as practical while preserving real behavior, accessibility, browser constraints, and honest data.

## Design identity

- Name: **Orange Pulse**. Clean product dashboard, **not** blue neon sci-fi.
- App icon: **bright warm orange lightning bolt** on a glossy dark navy rounded square; crisp silhouettes at 16, 32, 48 and 128 pixels. SVG source in `edge-quick-answer/icons/quickanswer.svg`.
- Background `#0B1220`, panel `#101A2D`, elevated `#162238`.
- Orange primary `#FF8A1F`, hover `#FFA94D`, stronger `#FF6B00`.
- Text `#F8FAFC`, secondary `#CBD5E1`, muted `#94A3B8`.
- Green success `#22C55E`, red errors `#EF4444`.
- No washed-out cyan on white; cyan permitted only for rare secondary indications. Warm orange controls and focus indicators.
- Rounded buttons/cards with soft borders, little glow, system UI fonts, strong WCAG-like legibility; light theme must be legible too.

## Popup anatomy — fixed

Header: orange icon · Quick Answer · version tag · small subtitle · circular **optically centered** gear. Success status bar. Three dense input rows for provider priority, question type, and reasoning. 2×2 actions: Text, Screenshot, Region, Other window. Bottom: Another model, solid orange Settings and keys. Footer: request count/time, RU/DE/EN, real hotkey status.

**Important runtime constraints**: compact real popup width ~390px, no clipping or dead controls. Keep existing working hotkeys `Ctrl+Shift+1`, `Ctrl+Shift+2`, `Ctrl+Shift+3`, `Ctrl+Shift+4` and the existing manifest command IDs (`qa-dom-153`, `qa-shot-153`, `qa-mode-153`, `qa-region-153`). The approved artwork may show illustrative key labels; do **not** implement those in place of the actual working ones.

## Settings anatomy — fixed

Dark left sidebar, legible orange selected state, header, two-column card dashboard: model order and selector, masked API keys, hotkeys/control, JPEG quality and cache, limits/response time, appearance, and password-encrypted backup. Settings auto-save. Show only measured/statistically supported values; do **not** invent a live quota percentage. Never show full keys in documentation screenshots.

## Website/docs anatomy — fixed

Header with icon/name/nav/language/GitHub; left hero copy with orange title segment and primary orange button; right browser mockup with real demo popup screenshot; five dark feature cards; guide/docs area with left table of contents and readable main sections. Separate static index and Guide pages for RU/DE/EN, plus a light/dark switch. Follow SoundLeaf and Virtual Piano Arranger portfolio norms: verified screenshots clearly labeled, honest preview limitations, architecture/rights/verification/release documentation, hashes, and no release links presented as published before publication.

## Non-negotiable engineering and legal constraints

- Keep storage key names and existing extension identity; never reset imported credentials or change command IDs.
- Don't commit or include API keys, user backups, user content, private paths, logs or account data.
- RU/DE/EN catalog key parity and localization in public docs.
- No new libraries/CDNs/trackers; no permissions without review.
- Check UI as **real browser-rendered HTML**, not just concept artwork, and distinguish Chromium simulation from Windows/Edge integration.
- Do not tag/push/create release or infer MIT licensing without the repository owner's explicit instruction. `docs/RIGHTS.md` explains rights.

## Local result

The 1.7 code is designed to follow the visual anatomy. Exact pixel-for-pixel equivalence to generated art across screen sizes is not technically promised; functionality and accessibility take precedence. **The concept images and this document are the persistent handoff for future chats.**
