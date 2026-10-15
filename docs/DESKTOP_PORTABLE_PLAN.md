# Portable desktop client

Source Preview 0.1 included in `desktop/`. Windows PowerShell 5.1 + WinForms; no admin or third-party runtime. This is a deliberately conservative stopgap until tested native x64 packaging can be produced. Secrets are protected using CurrentUser DPAPI and stored outside the public folder.

Suggested future route for EXE: validated C#/.NET self-contained Windows x64 publishing and authenticode signing if available. Do not call a ZIP of .ps1 files an EXE, and do not guarantee execution on a centrally managed school computer.
