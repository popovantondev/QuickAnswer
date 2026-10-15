# Quick Answer Desktop 0.1 — Windows Source Preview

**RUN:** extract this folder and double-click `START_QuickAnswer.cmd` (standard Windows account, no installer).

Requires Windows 10/11, **Windows PowerShell 5.1**, WinForms, .NET Framework. Does not require Python, Node.js, administrator permission or network access at startup. School policies may block scripts or screen capture. This is **not a compiled EXE** and is **not tested on Windows yet**.

Global shortcuts use **Ctrl+Alt+1** (screen), **Ctrl+Alt+2** (current foreground window), **Ctrl+Alt+4** (select a region). These deliberately differ from Edge to avoid conflicts. For the window hotkey, focus the target application and then press the hotkey. The GUI's **Window** button explains this because clicking it first changes the active window.

Enter your own Groq/Gemini keys in the API-keys panel. Settings are encrypted using Windows DPAPI `CurrentUser` and saved to `%LOCALAPPDATA%\QuickAnswerDesktop\settings.json`. Do not publish that file, even though its key entries are encrypted. If using ChatGPT Bridge, paste the pairing token from the separately running local bridge. Nothing is shipped preconfigured.

JPEG images are encoded in memory at 80% quality without downscaling and are transmitted to selected provider endpoints. No screenshot output is saved to the app directory. Screenshots of protected or exclusive fullscreen apps may be blank. Accuracy and latency are not guaranteed; API quotas and provider model availability can change.

The school/device operator may prohibit script execution. Don't bypass organizational restrictions without permission. Always comply with quiz rules and privacy obligations.


The bundled Bridge accepts browser extension origins only, so this desktop client is currently incompatible with it. Use Groq/Gemini for evaluation. RU/DE/EN covers the main controls; the key dialog and some errors remain English.
