"""Build the Quick Answer website (docs/) on the shared kit (docs/assets/kit).

Writes docs/index.html (German), index-en.html, index-ru.html, the redirect index-de.html
and Guide-{de,en,ru}.html. The look (Orange Pulse) lives in docs/assets/site.css; the
header, search, theme switch and footer come from the kit. Version and links come from
public-release.json. Run from the repository root:  python tools/build_site.py
Check without writing:                                python tools/build_site.py --check
"""
from pathlib import Path
from html import escape as e
import json
import sys

import site_images

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / 'docs'
LANGS = ('ru', 'de', 'en')
SITE = 'https://popovantondev.github.io/'
PROFILE = SITE + 'popovantondev/'
GITHUB = 'https://github.com/popovantondev/QuickAnswer'
LANDING = {'de': 'index.html', 'en': 'index-en.html', 'ru': 'index-ru.html'}
GUIDE = {l: 'Guide-%s.html' % l for l in LANGS}
CATALOG = {l: PROFILE + LANDING[l] for l in LANGS}
STACK = 'JavaScript'
RELEASE_TAG = 'v1.7.8-desktop-0.1-preview'
RELEASE_PAGE = GITHUB + '/releases/tag/' + RELEASE_TAG
EDGE_ZIP = GITHUB + '/releases/download/' + RELEASE_TAG + '/QuickAnswer-Edge-1.7.8.zip'
DESKTOP_ZIP = GITHUB + '/releases/download/' + RELEASE_TAG + '/QuickAnswer-Desktop-0.1-SourcePreview.zip'

# Interface strings of the site chrome.
UI = {
    'de': dict(skip='Zum Inhalt', nav='Hauptnavigation', all='Alle Programme', search='Suchen', kbd='Strg K',
               search_label='Programme durchsuchen', theme='Farbschema wechseln', legal='Rechtliches', new='NEU',
               pill='Version {v} ist da', more='Was ist neu →', rights='Rechte'),
    'en': dict(skip='Skip to content', nav='Main navigation', all='All programs', search='Search', kbd='Ctrl K',
               search_label='Search programs', theme='Switch colour scheme', legal='Legal', new='NEW',
               pill='Version {v} is out', more="What's new →", rights='Rights'),
    'ru': dict(skip='К содержимому', nav='Основная навигация', all='Все программы', search='Поиск', kbd='Ctrl K',
               search_label='Поиск по программам', theme='Сменить тему', legal='Правовая информация', new='НОВОЕ',
               pill='Вышла версия {v}', more='Что нового →', rights='Права'),
}

# Page texts. The rules paragraph (`rules`) is always the first paragraph under the heading.
TXT = {
    'de': dict(
        title='Quick Answer — Lernassistent für Edge',
        h1a='Quick Answer —', h1b='Lernassistent in Edge',
        desc='Quick Answer ist ein Lernassistent für Selbstkontrolle und Prüfungsvorbereitung in Microsoft Edge.',
        rules='Quick Answer ist ein Lernassistent für Selbstkontrolle und Prüfungsvorbereitung. Es gelten die Regeln Ihrer Schule oder Hochschule: Der Einsatz in Prüfungen, Klausuren und benoteten Tests ist untersagt.',
        lead='Die Edge-Erweiterung liest Text oder Screenshot einer Seite, fragt einen KI-Anbieter mit Ihrem eigenen Schlüssel und zeigt eine kurze Antwort mit Begründung zum Nachprüfen. Sie klickt nichts automatisch.',
        status='Edge-Erweiterung', platform='Microsoft Edge · Windows',
        download='Edge-Erweiterung herunterladen', source='Quellcode', guide='Anleitung', desktop='Desktop: Quellcode-Vorschau',
        req_title='Vor dem Start', req='Microsoft Edge und eigene Groq- oder Gemini-Schlüssel. Fragen und Bilder gehen an den gewählten Anbieter.',
        shot_alt='Popup von Quick Answer in Edge (Demo-Oberfläche ohne Schlüssel)',
        caption='Demo-Oberfläche ohne Schlüssel oder private Seiten. Hell: Rendering von 1.7.8 mit simulierten Edge-APIs; dunkel: frühere Version 1.7.4.',
        browser='Microsoft Edge · Quick Answer',
        bento='Was drin steckt', bento_sub='Installation, Funktionen, Datenschutz, Prüfung.',
        inst='Installation', inst_sub='Wie in der Anleitung: ZIP laden, entpacken, in Edge einbinden.',
        term=[('ps', '1  ZIP aus den Releases laden und ganz entpacken'),
              ('ps', '2  edge://extensions öffnen, Entwicklermodus einschalten'),
              ('ps', '3  „Entpackte Erweiterung laden“ → Ordner edge-quick-answer'),
              ('ok', '✓ Quick Answer erscheint in Edge'),
              ('dim', '   Strg+Umschalt+1 Text · 2 Screenshot · 4 Bereich')],
        feat='Funktionen',
        chips=['Seitentext lesen', 'Screenshot (JPEG)', 'Bereich markieren', 'Anderes Fenster', 'Kurzantwort mit Begründung', 'Modell-Kette mit Fallback', 'Schlüssel-Export mit Passwort', 'Diagnose'],
        data_title='Ihre Daten und Verbindung',
        data_text='Fragen und Bilder gehen an den gewählten KI-Anbieter. Dafür brauchen Sie eigene Schlüssel; die Erweiterung arbeitet weder lokal noch offline und sammelt keine Statistik.',
        data_chips=['Groq', 'Gemini', 'ChatGPT-Bridge (optional)'],
        checked='Geprüft',
        checks=['Mehr als 130 automatische Prüfungen in GitHub Actions (Manifest, Oberfläche, Sprachen RU/DE/EN)',
                'Schlüssel-Export, Antwortzuordnung und simulierter Ablauf werden im CI geprüft',
                'Veröffentlichte Dateien werden auf Schlüssel und private Pfade durchsucht',
                'SHA-256-Prüfsummen im Release (SHA256SUMS.txt)',
                'Version 1.7.8 mit Änderungsprotokoll'],
        status_title='Edge-Erweiterung und Desktop-Vorschau', status_sub='Zwei getrennte Stände mit unterschiedlichem Prüfstand.',
        edge_title='Edge-Erweiterung 1.7.8', edge_text='Als entpackte Erweiterung ladbar und beim Projektautor im Einsatz. Tests mit allen Anbietern und Schulseiten wurden nicht durchgeführt.',
        desk_title='Desktop 0.1 — ungetestete Quellcode-Vorschau',
        desk_text='Desktop-Archiv entpacken und START_QuickAnswer.cmd starten. Benötigt Windows 10/11, Windows PowerShell 5.1, WinForms und .NET Framework. Keine kompilierte EXE. Strg+Alt+1: Bildschirm; 2: aktives Fenster; 4: Bereich. Schlüssel: DPAPI CurrentUser. Bilder werden an den gewählten Anbieter gesendet. Laufzeit, Anbieter, DPI und Tastenkürzel sind ungeprüft. Die mitgelieferte Bridge akzeptiert nur Browser-Erweiterungen; Desktop ist derzeit inkompatibel.',
        desk_strong='Desktop 0.1: nur Quellcode, keine EXE; Windows-Start nicht geprüft.', desk_dl='Desktop-Quellcode herunterladen',
        flow_title='So funktioniert es', flow=['Frage erfassen: Text, Screenshot oder Bereich', 'Der Anbieter antwortet kurz, mit Begründung', 'Sie prüfen die Antwort selbst'],
        start_title='Erste Schritte', start_text='Die Anleitung führt in fünf Schritten von der Installation bis zu Schlüsseln und Diagnose.',
        # guide
        g_title='Quick Answer — Anleitung', g_h1='Anleitung', g_toc='Dokumentation', g_home='← Zur Programmseite', g_dl='Edge / Desktop Source Preview herunterladen',
        g_start='Loslegen →',
        steps=[('Installation', 'Laden Sie das ZIP aus den Releases herunter und entpacken Sie den vollständigen Ordner. Öffnen Sie edge://extensions, aktivieren Sie den Entwicklermodus und wählen Sie „Entpackte Erweiterung laden“. Wählen Sie den Ordner edge-quick-answer. Entfernen Sie die Erweiterung bei Updates nicht, sondern laden Sie sie neu: Eine neue Erweiterungs-ID kann den Zugriff auf gespeicherte Schlüssel kosten.'),
               ('Schnellstart', 'Ctrl+Shift+1 liest den Text, Ctrl+Shift+2 erstellt ein JPEG, Ctrl+Shift+4 wählt einen Bereich. Ctrl+Shift+3 wechselt das Frageformat. Für andere Fenster gibt es die Freigabe über Edge.'),
               ('Frageformate', 'AUTO versucht das Format zu erkennen. Bei Mehrfachauswahl zeigt Quick Answer Nummern und eine kurze Begründung, bei Aufgaben mit reiner Farbauswahl nur die Farbe. Prüfen Sie jede Antwort selbst.'),
               ('Modelle und Schlüssel', 'Hinterlegen Sie Ihre Groq- und Gemini-Schlüssel in den Einstellungen. Bei bestimmten Fehlern versucht die Erweiterung den nächsten Schlüssel oder Anbieter. ChatGPT erfordert die separat gestartete lokale Codex-Bridge.'),
               ('Diagnose und Grenzen', 'Sehen Sie sich Anfragezahl und Antwortzeit an. Bewahren Sie Schlüssel nur im Edge-Profil oder in einem verschlüsselten Backup auf. Fragen und Bilder werden an den ausgewählten Anbieter gesendet. Eine Antwortzeit ist nicht garantiert.')],
        g_notice='Vorabversion. Prüfen Sie die Antworten des Modells, schützen Sie vertrauliche Daten und beachten Sie die Regeln Ihrer Bildungseinrichtung.',
    ),
    'en': dict(
        title='Quick Answer — study assistant for Edge',
        h1a='Quick Answer —', h1b='Study assistant in Edge',
        desc='Quick Answer is a study assistant for self-checking and exam preparation in Microsoft Edge.',
        rules='Quick Answer is a study assistant for self-checking and exam preparation. The rules of your school or university apply: using it in exams, written tests or graded assessments is prohibited.',
        lead='The Edge extension reads the text or a screenshot of a page, asks an AI provider with your own key and shows a short answer with a reason you can check. It never clicks anything automatically.',
        status='Edge extension', platform='Microsoft Edge · Windows',
        download='Download the Edge extension', source='Source code', guide='User guide', desktop='Desktop: source preview',
        req_title='Before you start', req='Microsoft Edge and your own Groq or Gemini keys. Questions and images go to the selected provider.',
        shot_alt='Quick Answer popup in Edge (demo interface without keys)',
        caption='Demo interface without keys or private pages. Light: render of 1.7.8 with simulated Edge APIs; dark: earlier 1.7.4 capture.',
        browser='Microsoft Edge · Quick Answer',
        bento="What's inside", bento_sub='Installation, features, privacy, checks.',
        inst='Installation', inst_sub='As in the guide: download the ZIP, extract it, load it in Edge.',
        term=[('ps', '1  Download the ZIP from Releases and extract it fully'),
              ('ps', '2  Open edge://extensions and turn on Developer mode'),
              ('ps', '3  “Load unpacked” → folder edge-quick-answer'),
              ('ok', '✓ Quick Answer appears in Edge'),
              ('dim', '   Ctrl+Shift+1 text · 2 screenshot · 4 region')],
        feat='Features',
        chips=['Read page text', 'Screenshot (JPEG)', 'Select a region', 'Another window', 'Short answer with a reason', 'Model chain with fallback', 'Password-protected key export', 'Diagnostics'],
        data_title='Your data and connection',
        data_text='Questions and images go to the selected AI provider. You need your own keys; the extension works neither locally nor offline and collects no statistics.',
        data_chips=['Groq', 'Gemini', 'ChatGPT bridge (optional)'],
        checked='Checked',
        checks=['More than 130 automatic checks in GitHub Actions (manifest, interface, RU/DE/EN languages)',
                'Key export, answer mapping and a simulated run are checked in CI',
                'Published files are scanned for keys and private paths',
                'SHA-256 checksums in the release (SHA256SUMS.txt)',
                'Version 1.7.8 with a changelog'],
        status_title='Edge extension and desktop preview', status_sub='Two separate builds with different levels of testing.',
        edge_title='Edge extension 1.7.8', edge_text='Can be loaded as an unpacked extension and is in use by the project author. It has not been tested against every provider and school website.',
        desk_title='Desktop 0.1 — untested source preview',
        desk_text='Extract the desktop archive and run START_QuickAnswer.cmd. Requires Windows 10/11, Windows PowerShell 5.1, WinForms and .NET Framework. No compiled EXE is supplied. Ctrl+Alt+1 captures the screen, Ctrl+Alt+2 the foreground window, Ctrl+Alt+4 a region. Keys use DPAPI CurrentUser. Images go to the selected provider. Runtime, providers, DPI and hotkeys have not been verified. The bundled Bridge accepts browser extension origins only; desktop is currently incompatible with it.',
        desk_strong='Desktop 0.1: source only, no EXE; Windows launch not verified.', desk_dl='Download desktop source',
        flow_title='How it works', flow=['Capture the question: text, screenshot or region', 'The provider answers briefly, with a reason', 'You check the answer yourself'],
        start_title='First steps', start_text='The guide takes you in five steps from installation to keys and diagnostics.',
        g_title='Quick Answer — User guide', g_h1='User guide', g_toc='Documentation', g_home='← Program page', g_dl='Download Edge / Desktop Source Preview',
        g_start='Get started →',
        steps=[('Installation', 'Download the ZIP from Releases and extract the whole folder. Open edge://extensions, enable Developer mode, choose Load unpacked, and select the edge-quick-answer folder. Do not remove the extension when updating, reload it instead: a new extension ID can lose access to saved keys.'),
               ('Quick launch', 'Ctrl+Shift+1 reads page text, Ctrl+Shift+2 captures JPEG, Ctrl+Shift+4 selects a region, and Ctrl+Shift+3 cycles the question mode. For another window use Edge’s permission-based screen picker.'),
               ('Question formats', 'AUTO attempts to detect the type. For multiple choice, Quick Answer returns numbers and a brief reason; for tasks that only pick a colour it returns just the colour. Always verify the answer yourself.'),
               ('Models and keys', 'Enter your Groq and Gemini keys in Settings. On applicable failures, the extension tries the next available key or provider. ChatGPT requires an independently running local Codex Bridge.'),
               ('Diagnostics and limitations', 'Watch request counts and response time. Keep keys in your Edge profile or a password-encrypted backup. Text and screenshots are sent to the chosen provider; latency cannot be guaranteed.')],
        g_notice='Preview release. Verify model responses, protect confidential content, and follow the rules of your school or university.',
    ),
    'ru': dict(
        title='Quick Answer — учебный помощник для Edge',
        h1a='Quick Answer —', h1b='Учебный помощник в Edge',
        desc='Quick Answer — учебный помощник для самопроверки и подготовки в Microsoft Edge.',
        rules='Quick Answer — учебный помощник для самопроверки и подготовки. Соблюдайте правила своего учебного заведения: использовать его на экзаменах, контрольных работах и оценочных тестах запрещено.',
        lead='Расширение Edge читает текст или снимок страницы, спрашивает ИИ-провайдера по вашему собственному ключу и показывает короткий ответ с обоснованием, которое можно проверить. Ничего не нажимается автоматически.',
        status='Расширение Edge', platform='Microsoft Edge · Windows',
        download='Скачать расширение Edge', source='Исходный код', guide='Руководство', desktop='Desktop: исходники для ознакомления',
        req_title='Перед запуском', req='Microsoft Edge и собственные ключи Groq или Gemini. Вопросы и снимки отправляются выбранному провайдеру.',
        shot_alt='Окно Quick Answer в Edge (демонстрационный интерфейс без ключей)',
        caption='Демонстрационный интерфейс без ключей и личных страниц. Светлый вид: рендер 1.7.8 с имитацией API Edge; тёмный: снимок прежней версии 1.7.4.',
        browser='Microsoft Edge · Quick Answer',
        bento='Что внутри', bento_sub='Установка, функции, данные, проверка.',
        inst='Установка', inst_sub='Как в руководстве: скачать ZIP, распаковать, подключить в Edge.',
        term=[('ps', '1  Скачать ZIP из Releases и распаковать целиком'),
              ('ps', '2  Открыть edge://extensions, включить режим разработчика'),
              ('ps', '3  «Загрузить распакованное» → папка edge-quick-answer'),
              ('ok', '✓ Quick Answer появляется в Edge'),
              ('dim', '   Ctrl+Shift+1 текст · 2 снимок · 4 область')],
        feat='Функции',
        chips=['Текст страницы', 'Снимок (JPEG)', 'Выделение области', 'Другое окно', 'Краткий ответ с обоснованием', 'Цепочка моделей с резервом', 'Экспорт ключей с паролем', 'Диагностика'],
        data_title='Ваши данные и соединение',
        data_text='Вопросы и снимки отправляются выбранному ИИ-провайдеру. Нужны собственные ключи; расширение работает не локально и не офлайн и не собирает статистику.',
        data_chips=['Groq', 'Gemini', 'ChatGPT Bridge (по желанию)'],
        checked='Проверено',
        checks=['Более 130 автоматических проверок в GitHub Actions (манифест, интерфейс, языки RU/DE/EN)',
                'Экспорт ключей, сопоставление ответов и имитация работы проверяются в CI',
                'Опубликованные файлы проверяются на ключи и личные пути',
                'Контрольные суммы SHA-256 в релизе (SHA256SUMS.txt)',
                'Версия 1.7.8 с журналом изменений'],
        status_title='Расширение Edge и Desktop-превью', status_sub='Две отдельные сборки с разной степенью проверки.',
        edge_title='Расширение Edge 1.7.8', edge_text='Загружается как распакованное расширение и используется автором проекта. С каждым провайдером и школьным сайтом не проверялось.',
        desk_title='Desktop 0.1 — неиспытанный исходный Preview',
        desk_text='Распакуйте desktop-архив и запустите START_QuickAnswer.cmd. Требуются Windows 10/11, Windows PowerShell 5.1, WinForms и .NET Framework. Скомпилированного EXE нет. Ctrl+Alt+1: экран; 2: активное окно; 4: область. Ключи защищены DPAPI CurrentUser. Изображения отправляются выбранному провайдеру. Запуск, провайдеры, DPI и хоткеи не проверены. Вложенный Bridge принимает только браузерные расширения; desktop с ним пока несовместим.',
        desk_strong='Desktop 0.1: только исходники, без EXE; запуск в Windows не проверен.', desk_dl='Скачать исходники Desktop',
        flow_title='Как это работает', flow=['Захватить вопрос: текст, снимок или область', 'Провайдер коротко отвечает и объясняет', 'Вы сами проверяете ответ'],
        start_title='Первые шаги', start_text='Руководство за пять шагов проведёт от установки до ключей и диагностики.',
        g_title='Quick Answer — Руководство', g_h1='Руководство', g_toc='Документация', g_home='← На страницу программы', g_dl='Скачать Edge / Desktop Source Preview',
        g_start='Начать работу →',
        steps=[('Установка', 'Скачайте ZIP из Releases, распакуйте всю папку. Откройте edge://extensions, включите режим разработчика и нажмите «Загрузить распакованное». Выберите папку edge-quick-answer. При обновлении не удаляйте расширение, а перезагрузите его: новый ID расширения может лишить доступа к сохранённым ключам.'),
               ('Быстрый запуск', 'Нажимайте Ctrl+Shift+1 для текста страницы, Ctrl+Shift+2 для JPEG, Ctrl+Shift+4 для выделения. Ctrl+Shift+3 переключает формат. В другом окне используйте отдельную кнопку захвата с разрешением Edge.'),
               ('Типы вопросов', 'В АВТО расширение пытается определить формат. Для вопросов с выбором выводятся номера ответов и краткое обоснование, для заданий только с выбором цвета — цвет. Каждый ответ проверяйте сами.'),
               ('Модели и ключи', 'В настройках добавьте собственные ключи Groq и Gemini. Последовательное резервирование использует следующий ключ/провайдер при доступных ошибках. ChatGPT требует отдельно запущенного локального Codex Bridge.'),
               ('Диагностика и ограничения', 'Следите за количеством запросов и временем ответа. Сохраняйте ключи только в профиле Edge или в зашифрованной резервной копии. Данные вопросов передаются выбранному провайдеру. Время ответа не гарантируется.')],
        g_notice='Предварительная версия. Проверяйте ответы модели, не передавайте конфиденциальные материалы и соблюдайте правила своего учебного заведения.',
    ),
}


def load():
    return json.loads((ROOT / 'public-release.json').read_text(encoding='utf-8'))


def kit_version():
    return (DOCS / 'assets/kit/KIT_VERSION').read_text(encoding='utf-8').strip()


def head(lang, title, desc, version, depth=''):
    return ('<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
            '<meta name="color-scheme" content="light dark"><meta name="description" content="%s"><title>%s</title>\n'
            '<link rel="icon" href="assets/app-icon.png">\n'
            '<script src="assets/kit/kit-theme.js"></script>\n'
            '<link rel="stylesheet" href="assets/kit/kit.css?v=%s">\n'
            '<link rel="stylesheet" href="assets/site.css?v=%s">\n'
            '<script src="assets/kit/programs.js?v=%s" defer></script>\n'
            '<script src="assets/kit/kit.js?v=%s" defer></script>') % (e(desc), e(title), version, version, version, version)


def header(lang, pages):
    u = UI[lang]
    langs = ''.join('<a href="%s" lang="%s" hreflang="%s"%s>%s</a>' % (
        pages[x], x, x, ' aria-current="page"' if x == lang else '', x.upper()) for x in LANGS)
    return ('<div class="ppk-nav-wrap" id="ppk-nav-wrap">\n<nav class="ppk-nav" aria-label="%s">'
            '<a class="ppk-brand" href="%s"><img src="assets/app-icon.png" alt="" width="34" height="34"><span>Quick Answer</span></a>'
            '<span class="ppk-spacer"></span><a class="ppk-back" href="%s">← %s</a>'
            '<button class="ppk-search-btn" type="button" data-ppk-open-search aria-label="%s"><span>%s</span><kbd>%s</kbd></button>'
            '<div class="ppk-langs">%s</div>'
            '<button class="ppk-icon-btn ppk-theme-btn" type="button" data-ppk-theme aria-label="%s"></button>'
            '<a class="ppk-icon-btn ppk-gh-btn" href="%s" aria-label="GitHub"></a></nav>\n</div>') % (
        u['nav'], LANDING[lang], CATALOG[lang], u['all'], u['search_label'], u['search'], u['kbd'], langs, u['theme'], GITHUB)


def footer(lang, version):
    u = UI[lang]
    return ('<footer class="ppk-footer">\n<span>© 2026 Anton Popov · Quick Answer %s</span>\n'
            '<nav aria-label="%s"><a href="%simpressum.html">Impressum</a><a href="%sdatenschutz.html">Datenschutz</a>'
            '<a href="%s/blob/main/docs/RIGHTS%s.md">%s</a><a href="%s/issues/new">%s</a><a href="%s">GitHub</a></nav>\n</footer>') % (
        version, u['legal'], PROFILE, PROFILE, GITHUB, {'de': '.de', 'ru': '.ru', 'en': ''}[lang], u['rights'],
        GITHUB, {'de': 'Problem melden', 'ru': 'Сообщить об ошибке', 'en': 'Report a problem'}[lang], GITHUB)


def landing(lang, d, version):
    t, u = TXT[lang], UI[lang]
    guide = GUIDE[lang]
    pill = '<a class="ppk-pill" href="%s/blob/main/CHANGELOG.md"><span class="ppk-new">%s</span><span>%s</span> <span class="ppk-more">%s</span></a>' % (
        GITHUB, u['new'], e(u['pill'].format(v=d['version'])), u['more'])
    term = ''.join('<div class="ppk-%s">%s</div>' % (c, e(x)) for c, x in t['term'])
    chips = ''.join('<span>%s</span>' % e(x) for x in t['chips'])
    dchips = ''.join('<span>%s</span>' % e(x) for x in t['data_chips'])
    checks = ''.join('<li>%s</li>' % e(x) for x in t['checks'])
    flow = ''.join('<li>%s</li>' % e(x) for x in t['flow'])
    shot = 'assets/screenshots/popup-%s' % lang
    body = '''<body class="ppk-page">
<a class="ppk-skip" href="#main">%(skip)s</a>
%(header)s
<main class="ppk-shell" id="main">
<section class="ppk-hero"><div>
%(pill)s
<h1>%(h1a)s<br><em>%(h1b)s</em></h1>
<p class="qa-rules">%(rules)s</p>
<p class="ppk-lead">%(lead)s</p>
<span class="ppk-status">%(status)s · %(v)s</span> <span class="ppk-chip">%(platform)s</span>
<div class="ppk-actions"><a class="ppk-btn ppk-btn-primary" href="%(zip)s">%(download)s</a><a class="ppk-btn ppk-btn-gh" href="%(gh)s">%(source)s <span class="ppk-chip"><i class="ppk-dot"></i>%(stack)s</span></a><a class="ppk-btn" href="%(guide)s">%(guide_label)s ↗</a><a class="ppk-btn" href="#desktop-preview">%(desktop)s</a></div>
<p class="ppk-requirements"><strong>%(req_title)s</strong>%(req)s</p>
</div>
<figure class="ppk-preview"><div class="qa-browser-top"><i></i><i></i><i></i><span>%(browser)s</span></div><div class="ppk-stage"><div class="qa-popup"><img class="qa-dark" src="%(shot)s.png" alt="%(alt)s" decoding="async"><img class="qa-light" src="%(shot)s-light.png" alt="%(alt)s" decoding="async"></div></div><figcaption>%(caption)s</figcaption></figure>
</section>
<section class="ppk-bento-section ppk-section ppk-reveal" id="features" aria-labelledby="bento-title">
<h2 id="bento-title">%(bento)s</h2><p class="ppk-sub">%(bento_sub)s</p>
<div class="ppk-bento">
<div class="ppk-tile ppk-wide"><h3>%(inst)s</h3><p>%(inst_sub)s</p><div class="ppk-term" role="group" aria-label="Terminal"><div class="ppk-term-bar"><i></i><i></i><i></i></div><div class="ppk-term-out">%(term)s</div></div></div>
<div class="ppk-tile"><h3>%(data_title)s</h3><p>%(data_text)s</p><div class="ppk-chips">%(dchips)s</div></div>
<div class="ppk-tile"><h3>%(feat)s</h3><div class="ppk-chips">%(chips)s</div></div>
<div class="ppk-tile ppk-wide"><h3>%(checked)s</h3><ul class="ppk-checks">%(checks)s</ul></div>
</div>
</section>
<section class="ppk-section ppk-process ppk-reveal" aria-labelledby="process-title"><h2 id="process-title">%(flow_title)s</h2><ol class="ppk-flow">%(flow)s</ol></section>
<section class="ppk-section ppk-reveal" id="desktop-preview" aria-labelledby="status-title"><h2 id="status-title">%(status_title)s</h2><p class="ppk-sub">%(status_sub)s</p>
<div class="qa-status"><article class="qa-card"><h3>%(edge_title)s</h3><p>%(edge_text)s</p><div class="ppk-actions"><a class="ppk-btn ppk-btn-primary" href="%(zip)s">%(download)s</a></div></article>
<article class="qa-card qa-card-warn"><h3>%(desk_title)s</h3><p>%(desk_text)s</p><p><strong>%(desk_strong)s</strong></p><div class="ppk-actions"><a class="ppk-btn" href="%(dzip)s">%(desk_dl)s</a></div></article></div></section>
<section class="ppk-section ppk-reveal"><div class="qa-start"><div><h2>%(start_title)s</h2><p>%(start_text)s</p></div><div class="ppk-actions"><a class="ppk-btn ppk-btn-primary" href="%(guide)s">%(guide_label)s →</a></div></div></section>
</main>
%(footer)s
</body>''' % dict(
        skip=u['skip'], header=header(lang, LANDING), pill=pill, h1a=e(t['h1a']), h1b=e(t['h1b']), rules=e(t['rules']),
        lead=e(t['lead']), status=e(t['status']), v=e(d['version']), platform=e(t['platform']), zip=EDGE_ZIP,
        download=e(t['download']), gh=GITHUB, source=e(t['source']), stack=STACK, guide=guide, guide_label=e(t['guide']),
        desktop=e(t['desktop']), req_title=e(t['req_title']), req=e(t['req']), browser=e(t['browser']), shot=shot,
        alt=e(t['shot_alt']), caption=e(t['caption']), bento=e(t['bento']), bento_sub=e(t['bento_sub']), inst=e(t['inst']),
        inst_sub=e(t['inst_sub']), term=term, data_title=e(t['data_title']), data_text=e(t['data_text']), dchips=dchips,
        feat=e(t['feat']), chips=chips, checked=e(t['checked']), checks=checks, flow_title=e(t['flow_title']), flow=flow,
        status_title=e(t['status_title']), status_sub=e(t['status_sub']), edge_title=e(t['edge_title']),
        edge_text=e(t['edge_text']), desk_title=e(t['desk_title']), desk_text=e(t['desk_text']),
        desk_strong=e(t['desk_strong']), dzip=DESKTOP_ZIP, desk_dl=e(t['desk_dl']), start_title=e(t['start_title']),
        start_text=e(t['start_text']), footer=footer(lang, d['version']))
    return '<!doctype html>\n<html lang="%s"><head>%s\n</head>\n%s\n</html>\n' % (
        lang, head(lang, t['title'], t['desc'], version), body)


def guide(lang, d, version):
    t, u = TXT[lang], UI[lang]
    toc = ''.join('<a href="#step-%d">%d · %s</a>' % (i, i, e(s[0])) for i, s in enumerate(t['steps'], 1))
    steps = ''.join('<section class="qa-step" id="step-%d"><span class="qa-step-no">%02d</span><h2>%s</h2><p>%s</p></section>' % (
        i, i, e(s[0]), e(s[1])) for i, s in enumerate(t['steps'], 1))
    body = '''<body class="ppk-page">
<a class="ppk-skip" href="#main">%(skip)s</a>
%(header)s
<main class="ppk-shell qa-guide" id="main">
<p class="qa-guide-home"><a class="ppk-btn" href="%(home)s">%(home_label)s</a></p>
<header class="qa-guide-head"><p class="qa-kicker">Windows 11 · Microsoft Edge · %(v)s</p>
<h1>%(h1a)s<br><em>%(h1b)s</em></h1>
<p class="qa-rules">%(rules)s</p>
<div class="ppk-actions"><a class="ppk-btn ppk-btn-primary" href="#step-1">%(start)s</a><a class="ppk-btn" href="%(zip_page)s">%(dl)s</a></div></header>
<div class="qa-guide-layout"><aside class="qa-toc" aria-label="%(toc_title)s"><h2>%(toc_title)s</h2>%(toc)s</aside>
<div class="qa-steps">%(steps)s<p class="qa-note">%(notice)s</p></div></div>
<section class="ppk-section" id="desktop"><div class="qa-card qa-card-warn"><h2>%(desk_title)s</h2><p>%(desk_text)s</p><p><strong>%(desk_strong)s</strong></p></div></section>
</main>
%(footer)s
</body>''' % dict(
        skip=u['skip'], header=header(lang, GUIDE), v=e(d['version']), h1a=e(t['h1a']), h1b=e(t['g_h1']), rules=e(t['rules']),
        start=e(t['g_start']), zip_page=RELEASE_PAGE, dl=e(t['g_dl']), home=LANDING[lang], home_label=e(t['g_home']),
        toc_title=e(t['g_toc']), toc=toc, steps=steps, notice=e(t['g_notice']), desk_title=e(t['desk_title']),
        desk_text=e(t['desk_text']), desk_strong=e(t['desk_strong']), footer=footer(lang, d['version']))
    page = '<!doctype html>\n<html lang="%s"><head>%s\n</head>\n%s\n</html>\n' % (
        lang, head(lang, t['g_title'], t['desc'], version), body)
    # The shared site.css gained the home-link rule: new revision for the guides only.
    return page.replace('assets/site.css?v=%s' % version, 'assets/site.css?v=%s-g1' % version)


def redirect():
    """Old address of the German landing page: forwards to index.html, keeps all language links."""
    return ('<!doctype html>\n<html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
            '<script>location.replace(\'index.html\'+location.hash)</script><meta http-equiv="refresh" content="0; url=index.html"><link rel="canonical" href="%sQuickAnswer/index.html"><meta name="robots" content="noindex">'
            '<title>Quick Answer</title></head>\n<body><p><a href="index.html">Weiter zur deutschen Seite</a> · '
            '<a href="index-en.html" lang="en" hreflang="en">English</a> · <a href="index-ru.html" lang="ru" hreflang="ru">Русский</a></p></body></html>\n') % SITE


def outputs():
    d, version = load(), kit_version()
    out = {LANDING[l]: landing(l, d, version) for l in LANGS}
    out.update({GUIDE[l]: guide(l, d, version) for l in LANGS})
    out['index-de.html'] = redirect()
    return out


def main():
    check = '--check' in sys.argv
    bad = []
    for name, text in outputs().items():
        if name.endswith('.html'):
            text = site_images.optimize_page(text, DOCS, 'QuickAnswer', ROOT, name)
        path = DOCS / name
        data = text.encode('utf-8')
        if check:
            if not path.exists() or path.read_bytes() != data:
                bad.append(name)
        else:
            path.write_bytes(data)
    if check:
        if bad:
            print('Out of date (run python tools/build_site.py): ' + ', '.join(bad))
            return 1
        print('Site pages are up to date.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
