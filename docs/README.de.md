# Quick Answer — Projektanleitung

[Edge 1.7.8 / Desktop 0.1 Source Preview](https://github.com/popovantondev/QuickAnswer/releases/tag/v1.7.8-desktop-0.1-preview) · [RU](https://popovantondev.github.io/QuickAnswer/Guide-ru.html) · [DE](https://popovantondev.github.io/QuickAnswer/Guide-de.html) · [EN](https://popovantondev.github.io/QuickAnswer/Guide-en.html)

[English](../README.md) · [Русский](README.ru.md) · **Deutsch**

Quick Answer ist ein Lernassistent für Edge und Windows. Bildschirmausschnitte werden an Groq, Gemini oder eine optional verbundene lokale ChatGPT Bridge gesendet. Orange-Pulse-Design.

**Edge: 1.7.8, vom Projektbenutzer verwendet. Desktop: 0.1 Source Preview, noch nicht unter Windows getestet.**

## Edge

ZIP entpacken, `edge://extensions` öffnen, Entwicklermodus aktivieren, **Entpackte Erweiterung laden** und `edge-quick-answer` wählen. Bei Updates dieselben Dateien überschreiben und die bestehende Erweiterung neu laden. Nicht löschen, da sich die Erweiterungs-ID und der Zugriff auf gespeicherte Schlüssel ändern können.

`Ctrl+Shift+1` Text · `Ctrl+Shift+2` JPEG · `Ctrl+Shift+3` Quiz-Modus · `Ctrl+Shift+4` Bereich.

## Windows portable (ohne Administratorrechte)

Desktop-Ordner entpacken und `START_QuickAnswer.cmd` starten. Verwendet vorhandenes Windows PowerShell 5.1, WinForms und .NET, kein Python oder Node.js erforderlich. Organisatorische Richtlinien können Skripte oder Bildschirmzugriff sperren. Zugangsdaten werden per Windows DPAPI im aktuellen Benutzerprofil unter `%LOCALAPPDATA%\QuickAnswerDesktop` geschützt.

`Ctrl+Alt+1` Bildschirm · `Ctrl+Alt+2` aktives Fenster · `Ctrl+Alt+4` Bereich. Vor dem Fenster-Screenshot das Zielfenster fokussieren. Screenshots werden standardmäßig nicht gespeichert. **Der Desktop-Client ist eine ungetestete Quellcode-Vorschau, keine EXE.**

## Datenschutz und Grenzen

Fragen und Bilder werden zur Beantwortung an den gewählten Anbieter gesendet. Schlüssel, Diagnosen, Pairing-Tokens und Sicherungen gehören nicht in öffentliche Repositories. Keine Antwortgarantie oder garantierte Antwortzeit; Anbieter können ausfallen. Für den Originalcode wurde noch keine Lizenz gewählt: [RIGHTS](RIGHTS.md).


Desktop ist mit der mitgelieferten Browser-Bridge wegen der Origin-Prüfung derzeit inkompatibel. Groq/Gemini für Desktop verwenden. Anfragen, Aufnahme, DPI und Tastenkürzel sind ungeprüft. Schlüsseldialog und einige Fehler sind Englisch; RU/DE/EN ist teilweise lokalisiert.
