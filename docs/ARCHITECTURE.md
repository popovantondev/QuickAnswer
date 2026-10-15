# Architecture

- **Edge MV3**: `background.js` service worker routes commands, chooses sequential providers, controls timeout and local session cache.
- **UI**: `popup.html`/`settings.html` use local `i18n.js`, CSS and `chrome.storage.local` (keys remain inside profile). `content.js` displays a shadow DOM toast and selects a region.
- **Capture**: tab screenshot through `chrome.tabs.captureVisibleTab`; external window capture asks permission using `getDisplayMedia`, with in-memory JPEG encoding and optional cropping.
- **Providers**: Groq/Gemini with the user's own keys; optional local `companion/luna-bridge.js`. Sequential fallback may increase total time and uses provider quotas.
- **Data**: transient question text and JPEG remain in session memory only when optional diagnostics is enabled. Encrypted backup export is explicit and password protected.
- **i18n**: Russian, German, English for popup, settings and static capture/diagnostic UI; native server responses and some error/quiz-answer phrases remain provider-specific.
- **Security boundary**: screenshots may contain private information; cloud requests transmit user-selected data to the selected model provider. This extension is not certified for exam use or protected materials.
