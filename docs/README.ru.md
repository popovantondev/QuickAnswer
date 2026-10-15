# Quick Answer — Руководство по проекту

[Edge 1.7.8 / Desktop 0.1 Source Preview](https://github.com/popovantondev/QuickAnswer/releases/tag/v1.7.8-desktop-0.1-preview) · [RU](https://popovantondev.github.io/QuickAnswer/Guide-ru.html) · [DE](https://popovantondev.github.io/QuickAnswer/Guide-de.html) · [EN](https://popovantondev.github.io/QuickAnswer/Guide-en.html)

[English](../README.md) · [Deutsch](README.de.md) · **Русский**

Quick Answer — учебный помощник для Edge и Windows: захват вопроса, быстрый ответ Groq / Gemini / при подключении ChatGPT Bridge. Оформление Orange Pulse: тёмно-синий + оранжевый.

**Расширение Edge — 1.7.8 (рабочая версия). ПК-клиент — 0.1 Preview, ещё не проверен в Windows.**

## Edge

Распакуйте ZIP, откройте `edge://extensions`, включите режим разработчика и нажмите **Загрузить распакованное**. Выберите папку `edge-quick-answer`. Для обновления существующей версии копируйте файлы в ту же папку и нажмите **Перезагрузить**, не удаляя расширение. Ключи хранятся в профиле Edge и не входят в ZIP.

Горячие клавиши: `Ctrl+Shift+1` — текст, `Ctrl+Shift+2` — JPEG, `Ctrl+Shift+3` — тип теста, `Ctrl+Shift+4` — выделение.

## ПК, без администратора

Распакуйте папку `desktop`, запустите `START_QuickAnswer.cmd`. Используются встроенные PowerShell 5.1, WinForms, .NET. Установка Python или Node.js не требуется. Школьная политика может запретить запуск скриптов. Введите ключи Groq / Gemini в кнопке **Ключи API**.

`Ctrl+Alt+1` — экран, `Ctrl+Alt+2` — активное окно (предварительно переключитесь на него), `Ctrl+Alt+4` — область мышью. Файлы изображений не сохраняются. Ключи для ПК шифруются Windows DPAPI и лежат отдельно от папки программы, в `%LOCALAPPDATA%\QuickAnswerDesktop`.

**Пока это исходный Preview, а не проверенный EXE.** На Windows необходимо проверить запуск, доступ к экрану, хоткеи и настоящие ответы. При недоступности сервиса ожидание может выйти за 15 секунд.

## Конфиденциальность

Снимок отправляется выбранному провайдеру. Не загружайте в публичный репозиторий ключи, токены Bridge, резервные копии, журналы диагностики и личные снимки. Авторизационные данные не были добавлены в публичный пакет. Лицензия на собственный код пока не выбрана; см. [RIGHTS](RIGHTS.md).


Desktop пока несовместим с вложенным браузерным Bridge из-за проверки Origin. Для оценки desktop используйте Groq/Gemini. Запросы, захват, DPI и хоткеи не проверены. Окно ключей и часть ошибок на английском; RU/DE/EN локализация частичная.
