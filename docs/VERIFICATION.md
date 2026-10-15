# Verification status

- **Edge 1.7.8:** user reports it working on their Edge; static/mocked tests and source checks run in Linux. This does not independently establish every provider quota or school website behavior.
- **Desktop 0.1:** Windows PowerShell + WinForms source preview authored, NOT run in Windows in this environment. Hotkeys, DPI/multi-monitor positioning, API calls and bridge compatibility require end-to-end verification on Windows before an EXE release.
- **Secrets:** source archive scanned for common secret tokens, profile paths and binary credential/state files; see `scripts/audit-public.mjs`. This is an additional guard, not a proof that historical Git commits or other folders are clean.
- **Docs:** RU/DE/EN guides and website templates are present. Site links to GitHub are not live until the maintainer publishes a repository and GitHub Pages.
