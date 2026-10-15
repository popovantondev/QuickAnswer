# Release procedure

1. Verify Edge release source is at version **1.7.8** and unchanged from the tested Edge ZIP.
2. Run `node scripts/check-release.mjs`, `node scripts/check-backup.mjs`, `node scripts/check-choice-map.mjs`, `node scripts/check-execution.mjs`, `node scripts/audit-public.mjs`.
3. Recheck for secrets and identifying local paths after every new screenshot or documentation change.
4. Publish only sanitized source to a newly created **QuickAnswer** repository. Never publish `%LOCALAPPDATA%`, browser profile, encrypted settings backups, paired bridge tokens, API keys, diagnostics or user's screenshots.
5. Before labeling Windows Desktop as stable or producing a release installer/EXE, perform Windows 11 tests of first launch, hotkeys, screen/window/region capture, image resizing/encoding, provider failover, DPAPI storage, and error handling.
6. Do not assume the owner has selected a license. Do not change existing public repositories without explicit need.
