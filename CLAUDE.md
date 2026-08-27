# CV-Anwendung — Arbeitsgrundlagen

Interaktive CV-Anwendung (Next.js App Router, TypeScript, OpenAI-Streaming) für Bewerbungen
auf Festanstellungen in Deutschland. Zielgruppe: Recruiter und technische Entscheider.

## Zwei verbindliche Quellen

1. **[docs/build-prompt-cv-app.md](docs/build-prompt-cv-app.md)** — die Projektbeschreibung.
   Vor jeder Feature-Arbeit lesen. Sie definiert Funktionsumfang, Gestaltung und die Liste
   dessen, was ausdrücklich **nicht** gebaut wird.
2. **`templates/`** — der Code-Blueprint. Struktur und **Konventionen** werden 1:1 übernommen
   (CSS Modules, Tokens, px→rem, `@custom-media`, i18n-Muster). Seit dem Frontend-Milestone
   sind die generischen Platzhalterwerte des Blueprints (Palette, Beispiel-Komponenten) und
   das Projekt **bewusst auseinandergelaufen**: `templates/` bleibt der neutrale Starter,
   damit er wiederverwendbar bleibt; das Projekt-Root trägt die CV-spezifische Gestaltung.
   Es werden also **die Konventionen** gespiegelt, nicht mehr die konkreten Werte.

## Architektur (Frontend mit Fable, danach verdrahtet mit Opus)

Die vier Funktionen sind **verdrahtet**. Der CV bleibt server-gerendertes HTML (ohne JS
lesbar); eine Client-Steuerung greift über stabile `data-`-Haken hinein, statt ihn neu zu
rendern. Alle drei OpenAI-Aufrufe streamen serverseitig.

- **Eine Datenquelle:** [data/cv.ts](data/cv.ts) — typisiert, zweisprachig, jede Station/
  jeder Block mit stabiler `id`. Speist Darstellung **und** Modellkontext
  ([lib/cvContext.ts](lib/cvContext.ts)). Der `about`-Block (Projekte, Interessen, Stärken,
  Schwächen, Sonstiges) wird **nicht gedruckt**, speist aber den Chat/Matching/Summary-Kontext
  — leere Listen ⇒ der Assistent sagt ehrlich „nicht hinterlegt".
- **API-Route:** [app/api/assistant/route.ts](app/api/assistant/route.ts) — ein POST-Endpunkt
  für `matching | chat | summary`, Node-Runtime, streamt über die Web-Streams-API. Key
  serverseitig ([lib/openai.ts](lib/openai.ts)). Rate-Limit pro Session-Cookie + Tagesdeckel
  ([lib/rateLimit.ts](lib/rateLimit.ts)), Längenbegrenzung je Modus.
- **Systemprompts:** [lib/prompts.ts](lib/prompts.ts) — drei Prompts, alle mit demselben
  Vertrag: nur aus den CV-Daten, fehlende Info offen sagen, Einträge per id zitieren, knapp,
  Prompt-Probing/Off-Topic trocken abweisen. Der Matching-Prompt trägt zwei Regeln, die aus
  echten Fehlausgaben stammen und nicht wegoptimiert werden dürfen: **Pflichtprüfung vor jedem
  „gap"** (kommt der Begriff irgendwo in den Daten vor — auch in `stack`, `items`, `note` oder
  im about-Block inklusive `weaknesses` —, ist es höchstens „partial"), und **Menge je Bucket**
  („fit" bleibt der Schwerpunkt mit 4–7 Punkten, „partial" und „gap" je mindestens zwei, aber
  nie eine erfundene Lücke, nur um auf zwei zu kommen) mit einer Selbstprüfung vor der Ausgabe.
  Deshalb steht `max_tokens` für `matching` höher als für die anderen Modi: eine abgeschnittene
  Zeile ist ein Befund, den der Client stillschweigend verwirft. Matching gibt **NDJSON** aus (eine `order`-Zeile
  und je eine `finding`-Zeile, buckets fit/partial/gap), der Client parst zeilenweise beim
  Streamen. Chat/Zusammenfassung streamen Prosa mit `[id]`-Zitaten.
- **Client-Zustand:** [components/app/AppState.tsx](components/app/AppState.tsx) — ein Provider
  hält Matching/Chat/Summary/Status, persistiert Chat + Anzeige in `localStorage` (übersteht
  Reload), und fährt die DOM-Effekte: `data-highlight` bei Hover/Klick, `order` +
  **FLIP-Animation** für die Umsortierung ([lib/dom.ts](lib/dom.ts)). `[id]`-Zitate werden
  über [RefText](components/app/RefText.tsx)/[EntryRef](components/app/EntryRef.tsx) zu
  interaktiven Chips (Hover leuchtet, Klick scrollt).
- **Abschnittsreihenfolge:** [lib/sections.ts](lib/sections.ts) — `SECTIONS` ist die **einzige**
  Quelle: Kurzprofil · Berufserfahrung · **Ausbildung** · Kenntnisse · Sprachen. Daraus kommen die
  Sprungmarken der Kopfleiste, die laufenden Nummern (`sectionNumber()`, benutzt von
  [CvSection](components/cv/CvSection.tsx) **und** beiden PDFs — nie von Hand getippt) und die
  Reihenfolge der Notiz-Zusammenfassung ([marked.ts](lib/pdf/marked.ts)). Umsortieren heißt:
  die Liste ändern **und** die JSX-Blöcke in [CvDocument](components/cv/CvDocument.tsx),
  [CvPdf](lib/pdf/CvPdf.tsx), [QrPdf](lib/pdf/QrPdf.tsx) und die Schleifen in `marked.ts`
  mitziehen — die Nummern folgen dann von selbst.
- **Adressierbarkeit:** Jeder Eintrag rendert mit `id={entry.id}` **und** `data-entry={id}`.
  Matching/Chat setzen `data-highlight="true"` (Aufleuchten als CSS-Transition) und `order`
  auf den Experience-Flex-Items.
- **Notiz-Mitschrift:** native Checkboxen (`[data-mark]`) in `<form id="cv-marks">`; CSS-Counter
  `marks` speist Zähler, `:has()` blendet die Leiste ein, `type="reset"` (`form="cv-marks"`)
  leert alles — **ohne JS**. Die Zusammenfassung liest die markierten ids
  ([SummaryDialog](components/app/SummaryDialog.tsx)), streamt eine Einordnung, bietet Kopieren
  und ein gesetztes PDF (siehe unten).
- **Chrome:** [components/shell/](components/shell) — feste Mono-Leisten, Statuszeile mit
  echten Readouts, Tastaturkürzel (⌘/Ctrl K, „/", Esc) über `KeyBindings`. Die Leiste zeigt
  nur, was es gibt: „Assistent" (nicht „Status" — sonst bleibt offen, _was_ bereit ist) immer,
  Modell/Antwortzeit erst nach einer Anfrage, Markierungen erst wenn markiert wurde (per
  `:has()` aus AppShell, also ohne JS). Am Ende der Leiste die Wege hinaus
  ([DocumentLinks](components/shell/DocumentLinks.tsx)), in der Reihenfolge, wie viel sie vom
  Leser verlangen: Teilen · QR-Code · PDF. Alle drei tragen die Unterstreichung **explizit** — zwei
  sind Anker und bekämen sie vom Browser, „Teilen" ist ein Button und bekäme sie nicht, und dann
  sieht eine von drei Aktionen aus wie eine andere Art Ding. QR-Code und PDF sind gewöhnliche Links
  (serverseitig, ohne JS), „Teilen" ist [ShareLink](components/shell/ShareLink.tsx) — es gibt
  kein Markup für ein Share-Sheet. Der Knopf rendert **nichts**, bis ein Effekt geklärt hat, ob
  `navigator.share` oder wenigstens die Zwischenablage da ist: dieselbe Regel wie sonst in der
  Leiste (nur zeigen, was es gibt), und der no-JS-Fall fällt ohne zweiten Codepfad heraus.
- **Tastatur & Viewport (mobil):** Die Chat-Leiste liegt fix am unteren Rand — iOS lässt die
  Bildschirmtastatur darüber gleiten, weil das Layout-Viewport seine Höhe behält. Deshalb
  veröffentlicht [ViewportSync](components/shell/ViewportSync.tsx) das _visuelle_ Viewport als
  `--keyboard-inset` (verdeckter Rand) und `--viewport-height`, und das Chrome rechnet damit:
  Bezugsgröße ist `documentElement.clientHeight`, **nicht** `window.innerHeight` — `fixed` misst
  gegen das Layout-Viewport, iOS' `innerHeight` meldet aber das _große_ Viewport (Browser-Leisten
  eingeklappt). Mit `innerHeight` war der Inset genau um deren Höhe zu groß und unter der
  Chat-Leiste stand ein Streifen Dokument. Zusätzlich füllt `.panel::after` den Bereich zwischen
  Leiste und Seitenunterkante in `--color-surface`: keine Messung kann dann noch Inhalt
  durchscheinen lassen. Safaris Formular-Leiste (Pfeile + Häkchen über der Tastatur) ist vom Web
  aus nicht abschaltbar — ihre Höhe steckt aber im Inset, die Leiste sitzt also darüber.
  `bottom: max(--chrome-bottom, --keyboard-inset)` (die Leiste reitet auf der Tastatur) und
  `max-height: calc(var(--viewport-height) - var(--chrome-top))` (das Panel wächst nie über den
  Schirm hinaus — sonst stand der neueste Absatz außerhalb). Ohne JS bleiben die Ruhewerte aus
  `tokens.css` stehen, also der Fall ohne Tastatur. Android löst dasselbe über
  `interactiveWidget: 'resizes-content'` (Viewport-Export im Layout); Safari ignoriert es.
  Höhen im Chrome stehen in `dvh`, nicht `vh` — bei ausgefahrenen Browser-Leisten ist `100vh`
  höher als der Schirm. Innerhalb des Panels füllt `.inner` den Track, damit **das Transkript**
  scrollt (und das Nachführen beim Streamen greift), nicht das ganze Panel.
- **Mobiles Chrome:** Chat-Leiste und Tray liegen über dem Dokument, deshalb reserviert
  `.frame` unten genau deren Höhe (`--chat-bar` + `--chrome-bottom`, plus `--tray-height`
  wenn markiert ist) — sonst ist der Schluss des CV nicht lesbar. Der zugeklappte Chat
  animiert über `grid-template-rows`; das animierte Grid-Item (`.track`) darf **kein** Padding
  tragen, sonst klappt es nie ganz zu. Nach dem Senden geht der Fokus zurück ins Eingabefeld
  und `data-open` hält das Panel während des Streamens offen — sonst klappte es beim Senden zu
  (der Senden-Knopf wird `disabled` und verliert den Fokus).
- **Zwei Layouts, und das ist der Punkt:** [app/layout.tsx](app/layout.tsx) trägt `<html>`,
  `<body>`, die Schriften und das **einzige eigene Inline-Skript** (JS-Flag `data-js` für den
  Preloader + gespeicherte Ansicht, siehe [lib/theme.ts](lib/theme.ts));
  [app/[locale]/layout.tsx](app/[locale]/layout.tsx) trägt nur Metadaten, `setRequestLocale` und
  die Provider. Grund: das Root-Layout liegt **über** dem `[locale]`-Segment und wird beim
  Sprachwechsel **nicht** neu gerendert. Läge das Skript im Locale-Layout, würde React es bei
  jedem Sprachwechsel client-seitig rendern — und warnt dann zu Recht („Encountered a script tag
  while rendering React component"), denn dort läuft es nie. **A/B im Browser verifiziert**
  (CDP, Dev-Server): Skript im Locale-Layout ⇒ Warnung, Skript im Root-Layout ⇒ keine, in beiden
  Fällen eine echte Client-Navigation (Marker auf `window` überlebt). Das Skript **muss** ein
  rohes Tag bleiben, das der Parser an der Stelle ausführt: `next/script`
  `beforeInteractive` schiebt den Code nur in die `__next_s`-Queue, die erst nach dem ersten
  Paint läuft (⇒ Preloader- und Palettenblitz), und ein Guard auf den `RSC`-Header geht nicht,
  weil Next seine Routing-Header vor `headers()` wegfiltert (beides geprüft, nicht vermutet).
  Preis des Umbaus: `<html lang>` kann nicht aus dem Segment-Param kommen. Es kommt aus
  `x-locale`, das die [middleware.ts](middleware.ts) setzt (richtig bei **jeder**
  Dokument-Anfrage, auch ohne JS), und nach einem Sprachwechsel im laufenden Dokument zieht
  [DocumentLocale](components/app/DocumentLocale.tsx) das Attribut nach.
- **Typografie:** IBM Plex Sans (Inhalt) + IBM Plex Mono (Interface) via `next/font`. Der
  Sans/Mono-Wechsel trennt Inhalt von Interface — auch im Kopf: Name in der Display-Stimme
  (Sans 600), Rolle in der Interface-Stimme (Mono, uppercase, `tracking-label`, Tinte),
  Kontaktzeile ebenso, aber gedeckt. Drei Bänder, drei Lautstärken. Zeilenlänge geprüft auf ~70 Zeichen
  (`--measure: 56ch`; `1ch` = Breite der „0", breiter als das Durchschnittszeichen).
- **Farbe/Motion:** ein Akzent nur für aktive Zustände; Palette rechnerisch gegen WCAG AA
  geprüft (Light + Dark). Motion 150–250 ms mit eigenen Kurven, `prefers-reduced-motion`
  global respektiert. Dark Mode folgt der Umgebung — und ist seit dem Umschalter (siehe unten)
  überschreibbar.
- **Ansichts-Umschalter:** [ThemeSwitch](components/shell/ThemeSwitch.tsx) in der Kopfleiste,
  drei Zustände: `auto | hell | dunkel`. **Abweichung von der Projektbeschreibung** ("Kein
  Dark-Mode-Umschalter als Feature", docs/build-prompt-cv-app.md) — auf ausdrückliche Ansage
  hinzugefügt; der Rest der Regel bleibt: kein Icon, keine zweite Gestalt, dieselbe Form wie
  der Sprachwechsler daneben. Beide sind [BarMenu](components/shell/BarMenu.tsx) und sitzen in
  **einem** Cluster (`.settings`) — siehe nächster Punkt.
- **Zwei Menüs statt fünf Chips ([BarMenu](components/shell/BarMenu.tsx), Atom in
  [styles/components/bar-menu.css](styles/components/bar-menu.css)):** Ansicht und Sprache lagen
  erst flach in der Leiste (`ANSICHT AUTO HELL DUNKEL · SPRACHE de en`) — fünf Wörter Interface
  über einem Dokument, das zuerst sprechen soll. Jetzt zeigt jedes Menü **nur seinen aktuellen
  Wert** (`HELL ▾`, `DE ▾`), der Rest liegt in der Schublade. Die Namen sind **gesprochen, nicht
  gedruckt** (`aria-label` am `summary` als „Sprache: de", plus am Panel).
  Es ist ein **`<details>`/`<summary>`** — genau deshalb: es öffnet, schließt und nimmt die
  Tastatur **ohne JavaScript**, der Sprachwechsel bleibt also serverseitiges HTML mit echten
  `Link`s (verifiziert: das Markup steht im Server-HTML). Was die Komponente ergänzt (Esc,
  Klick daneben, Zugehen nach der Wahl) ist Kür und darf ausfallen. **`display: flex` darf nie
  direkt auf das `summary`** — WebKit hört dann auf zu toggeln; deshalb flext `.bar-menu-row`
  darin. Die Steuerung ist auf **volle Leistenhöhe** gestreckt (`align-self: stretch`): so
  hängt das Panel an der Haarlinie der Leiste (kein eigener oberer Rand, Radien nur unten — es
  liest als aus der Leiste gezogene Schublade) und ein Daumen bekommt 44px. Der Caret sind zwei
  Haarlinien mit `border`, kein Icon — das Briefing verbietet Icons in der Navigation. Warum
  Atom und kein CSS Module: die eine Hälfte rendert client (Ansicht), die andere server
  (Sprache); beide müssen dasselbe Objekt sein.
  `auto` ist die **Abwesenheit** des Stempels: nur `hell`/`dunkel` setzen `data-theme` auf
  `<html>`, ohne Attribut entscheidet weiterhin `prefers-color-scheme` — das ist auch der
  Fall ohne JavaScript. Die Palette steht deshalb zweimal in [tokens.css](styles/base/tokens.css)
  (eine Media Query kann nicht in einer Selektorliste stehen): beide Blöcke synchron halten.
  `color-scheme` wandert mit, damit Scrollbalken und Caret folgen. Der ganze Client-Zustand
  liegt in [lib/theme.ts](lib/theme.ts) — inklusive des Inline-Skript-Schnipsels, den das
  Layout **vor dem ersten Paint** ausführt (eine Anwendung nach der Hydration wäre ein
  Palettenblitz) und der `watchTheme`-Subscription, die Favicon und Porträt-Canvas an
  dieselbe Entscheidung hängt. Der Knopf rendert **nichts**, bis ein Effekt die Präferenz
  gelesen hat — Server-Markup und erster Client-Render bleiben identisch, und der no-JS-Fall
  fällt ohne zweiten Codepfad heraus (dieselbe Regel wie [ShareLink](components/shell/ShareLink.tsx)).
  [print.css](styles/print.css) überschreibt beide Stempel: Papier ist Papier.
- **PDF (Hauptweg auf Papier):** [app/api/pdf/route.tsx](app/api/pdf/route.tsx) setzt alle drei
  Dokumente serverseitig mit `@react-pdf/renderer` — aus derselben einen Quelle wie der
  Bildschirm. `GET /api/pdf?doc=cv&locale=de` liefert den Lebenslauf, `GET …?doc=qr` die
  einseitige Karte (deshalb normale Links in der Statusleiste: **funktionieren ohne JS**),
  `POST /api/pdf` die Notiz-Zusammen-
  fassung — sie muss markierte ids und die Einordnung mitschicken, die nur im Client liegen
  und in keiner URL etwas zu suchen haben. Der Dialog schickt dafür ein **Formular** mit
  `target="_blank"` statt eines `fetch`: dann ist es eine echte Navigation, der Tab landet auf
  `/api/pdf` (gleiche Art Adresse wie beim CV-Link, kein `blob:`) und der Viewer bekommt den
  Dateinamen aus dem Header. Die Route nimmt deshalb **beide** Bodys — Formular _und_ JSON
  (letzteres für programmatische Aufrufe) — und meldet Fehler entsprechend: als lesbare
  HTML-Seite bei einer Navigation, als JSON bei einem `fetch`. Dokumente in
  [lib/pdf/](lib/pdf): `frame.tsx` (Seite, Fuß, Abschnittsköpfe, id-Spalte), `CvPdf.tsx`,
  `QrPdf.tsx`, `SummaryPdf.tsx`, Papier-Tokens in `theme.ts`, Schriften in `fonts.ts`. Strings
  kommen als Label-Objekt aus der Route ([labels.ts](lib/pdf/labels.ts)) — die Dokumente
  bleiben reine Funktionen von Daten + Labels.
- **Kurzprofil-Karte (`doc=qr`):** [lib/pdf/QrPdf.tsx](lib/pdf/QrPdf.tsx) — **eine** Seite, die
  den Leser zurück ins Web schicken soll: Kopf, Kurzprofil, die ausgewählten Stationen
  (Mono-Datumsspalte, Rolle, Arbeitgeberzeile), das Studium unter „Ausbildung" (dieselbe
  dreispaltige Form wie eine Station, ohne Notiz und Credential-Zeile), die ausgewählten
  Kenntnisse als Chips, unten ein Band mit QR-Code und Adresse. Highlights, die kurzen
  Zertifikate, Sprachen und der lange Rest der Kenntnisse bleiben dem vollen Dokument. Zwei Regeln halten die Karte ruhig — beim Erweitern einhalten: **eine Stimme
  pro Zeile** (Datum, Rolle und Arbeitgeber je auf ihrer eigenen Zeile; auf eine Zeile gedrängt
  waren es drei konkurrierende Signale) und **keine Farbe** (der Akzent ist für aktive Zustände
  am Bildschirm — auf einem Blatt mit einer Handlungsaufforderung liest eine rote Zeile als
  Warnung). Das Band hängt über `spacer` (`flexGrow`) am unteren Rand statt am Textende; passt
  es nicht mehr, rutscht es auf ein zweites Blatt statt zu kollidieren. Aktuell ~40 pt Luft —
  beim Erweitern die Seitenzahl prüfen (`/Count` im PDF), eine zweiseitige „einseitige Karte"
  ist ein Fehler.
- **Auswahl für die Karte:** `card: true` in [data/cv.ts](data/cv.ts) entscheidet, was auf die
  Karte kommt — an einem `CvSkillItem` (~20 Begriffe, das tägliche Handwerk), an einer
  `CvExperience` (die Stationen, die die Arbeit noch beschreiben; das Praktikum von 2013 ist
  bewusst nicht dabei) und an einer `CvEducation` (das Studium, nicht die Coursera-Zertifikate).
  Das Flag steht **am Eintrag**, nicht als zweite Liste — sonst driftet die Auswahl von den
  Daten weg; `QrPdf` filtert nur danach. Der
  Modellkontext ([cvContext.ts](lib/cvContext.ts)) sieht weiterhin **alles**: das Flag
  ist eine Entscheidung über Papier, nicht über Wahrheit. Der Chip-Block ist der **einzige**
  Block der Karte ohne id-Spalte und läuft deshalb über die volle Breite: ein halbes Dutzend
  Gruppen-ids neben einer Chip-Wolke zeigt auf nichts Bestimmtes — die Chips sind nicht je ein
  Eintrag. Die Gruppenlabels und die ehrlichen Notizen stehen am Bildschirm.
- **QR-Code:** [lib/pdf/qr.ts](lib/pdf/qr.ts) macht aus der URL **einen** SVG-Pfad
  (`qrcode-generator`, Fehlerkorrektur M, Ruhezone 4 Module). Ein `<Rect>` je Modul wären
  tausend Knoten und die Kantenglättung hinterlässt Haarrisse dazwischen — deshalb wird jeder
  waagerechte Lauf dunkler Module ein Teilpfad. Koordinaten in Modulen, Druckgröße kommt aus
  der `viewBox`.
- **Adresse:** [lib/siteUrl.ts](lib/siteUrl.ts) leitet sie aus dem Request ab (`localePrefix:
'as-needed'` wird gespiegelt), damit eine Preview-Deployment einen QR auf sich selbst druckt.
  `SITE_URL` überschreibt, wenn der öffentliche Name nicht der Host ist, den die App sieht.
- **Papier-Konventionen** (in `theme.ts` festgehalten, beim Erweitern einhalten): **vier
  Schriftgrößen** für das ganze Dokument (`mono` Interface · `small` Sekundärtext · `body`
  Fließtext · `title` Eintragstitel) — Hierarchie über Gewicht, Auszeichnung und Abstand, nicht
  über Größe. Alles Mono ist Interface und steht **uppercase mit `tracking.label`** (ids,
  Rolle im Kopf, Kontaktzeile, Abschnitts- und Meta-Zeilen), genau wie am Bildschirm. Jeder Eintrag hat
  dieselbe Form: Mono-Zeile oben, Titel darunter. Der erste Eintrag eines Abschnitts trägt
  **keinen** Trennstrich (die Abschnittslinie steht schon da).
- **Print (Fallback):** [styles/print.css](styles/print.css) blendet das Interface aus;
  `data-print`-Haken markieren, was Dokument bleibt. Bleibt bewusst erhalten: Ctrl+P muss
  auch ohne JS ein brauchbares Blatt ergeben. Ist der Zusammenfassungs-Dialog offen, steht
  `data-summary-print` auf `<html>` — dann druckt Ctrl+P nur die Notiz.

## Konventionen (aus dem Blueprint)

- **CSS:** Kein Framework, keine Component-Library. Pro Komponente ein CSS Module mit einer
  expliziten Klasse pro Element — keine Descendant-Selektoren.
- **Tokens:** Farben, Spacing, Radien, Schriftgrößen ausschließlich über `var(--…)` aus
  `styles/base/tokens.css`. Keine Hex-Werte außerhalb dieser Datei (Stylelint bricht sonst ab).
- **Eingabefelder:** Schriftgröße immer `var(--font-size-field)` — unter `pointer: coarse` sind
  das 16px, weil iOS die Seite beim Fokussieren sonst hineinzoomt. Gilt für jedes Feld, in das
  getippt wird (Chat-Eingabe, Abgleich-Textfeld, URL-Feld).
- **Einheiten:** Im Quellcode immer `px` schreiben — `postcss-pxtorem` konvertiert beim Build
  zu `rem`. Niemals `rem` von Hand (Ausnahme: `clamp()` in `tokens.css`).
- **Breakpoints:** `@media (--bp-medium-up)` etc. aus `styles/base/media.css`.
- **Layer:** `base` → `components` → `utilities`; CSS Modules sind unlayered und gewinnen damit.
- **i18n:** Locales nur in `i18n/routing.ts` (Default `de`, `en` unter `/en`). Neue Strings
  immer in `i18n/messages/de.json` **und** `en.json` — `en.json` speist die Typen in
  `global.d.ts`, ein fehlender Key ist ein Compile-Fehler.
- **Navigation:** `Link`/`useRouter`/`usePathname` aus `i18n/navigation.ts`, nie aus `next/link`
  oder `next/navigation` — sonst bricht das Locale-Prefixing.
- **Layout-Wrapper:** `.container` (Max-Width-Grid), Buttons über das globale `.button`-Atom.

## Nicht verhandelbar (aus der Projektbeschreibung)

- Der CV ist ohne JavaScript vollständig lesbar; die drei interaktiven Funktionen sind Erweiterung.
- Der CV liegt als **eine** strukturierte Datei vor und speist Darstellung _und_ Modellkontext.
  Keine Duplikate.
- Jede CV-Station und jeder Kenntnisblock hat eine stabile ID, auf die Matching, Chat und
  Notizen referenzieren.
- Alle drei Systemprompts (Matching, Chat, Zusammenfassung) antworten nur auf Basis der
  übergebenen Daten und sagen bei fehlender Information, dass sie fehlt.
- Der Matching-Block „Was fehlt" muss ehrlich sein — der Systemprompt muss Gefälligkeit
  aktiv unterdrücken.
- OpenAI-Key bleibt serverseitig. Rate-Limit pro Session, Tagesdeckel, Längenbegrenzung.
- Barrierefreiheit: volle Tastaturbedienung, sichtbare Fokusindikatoren, Landmarks,
  gestreamter Text in einer Live-Region, WCAG AA. `prefers-reduced-motion` respektieren.

## Befehle

```bash
npm run dev          # Dev-Server
npm run build        # Produktionsbuild (führt auch den Typecheck aus)
npm run typecheck    # tsc --noEmit
npm run lint:css     # Stylelint über app/, components/, styles/
npm run format       # Prettier
```

Alle vier laufen aktuell fehlerfrei durch.

## Umgebung

`.env.local` mit `OPENAI_API_KEY=…` anlegen (nicht im Repo, nie als `NEXT_PUBLIC_*`).
Optional: `SITE_URL` fixiert die Adresse, die QR-Karte und Share-Sheet ausgeben (ohne die
Variable kommt sie aus dem Request). `OPENAI_MODEL` überschreibt die Modellwahl. Ohne diese Variable folgt der Default
der Umgebung: Produktion (`NODE_ENV=production`) nutzt `gpt-4o` (stärkeres Paraphrasen-Reasoning
hält den Abgleich ehrlich, ohne gefällig zu werden), Entwicklung bleibt auf dem schnellen,
günstigen `gpt-4o-mini`. Ohne Key liefert die Route `503` und die Oberfläche zeigt
„KI-Funktionen nicht konfiguriert".

**Dev-Mock:** Ohne Key und mit `ASSISTANT_MOCK=1` (nur `NODE_ENV!==production`) streamt die
Route ein klar mit `[DEV-MOCK]` gekennzeichnetes Skript — zum Testen der Interaktionen ohne
Key/Kosten. In Produktion immer aus.

**URL-Abgleich:** Im Matching kann statt Text eine URL kommen ([lib/fetchAdvert.ts](lib/fetchAdvert.ts)).
Erst ein direkter, SSRF-gehärteter Server-Fetch (nur http/s, Host muss öffentlich auflösen,
Redirects hop-weise revalidiert, Zeit-/Größen-Cap). Scheitert der (Portale rendern per JS und
kappen Nicht-Browser-Verbindungen), greift ein **Reader-Fallback** (rendert die Seite, liefert
Text) — die eingegebene URL verlässt dabei den Server Richtung Drittdienst. Abschaltbar mit
`ADVERT_READER=0`; optionaler Key via `ADVERT_READER_KEY`. Der Fallback läuft nur nach
bestandener Public-Host-Prüfung und nie bei `invalid_url` — kein SSRF-Bypass. Der extrahierte
Text wird dem Client als erste NDJSON-Zeile (`type:'advert'`) zurückgegeben, damit Chat-Kontext
und Restore identisch zum Texteingabe-Modus funktionieren.

**Security-Header:** Statische Header (HSTS nur in Prod, `X-Content-Type-Options`, `X-Frame-Options`,
`Referrer-Policy`, `Permissions-Policy`, `X-Robots-Tag`) in `next.config.mjs` (`headers()`). Die
**CSP** trägt einen **Per-Request-Nonce** und liegt deshalb in [middleware.ts](middleware.ts):
Prod strikt (`script-src 'self' 'nonce-…' 'strict-dynamic'`, `upgrade-insecure-requests`), Dev
gelockert (`'unsafe-eval' 'unsafe-inline'`, `ws:` — sonst bricht HMR). Die Middleware setzt die CSP
**auch auf die Request-Header**, damit Next seine Inline-(RSC/Hydration-)Skripte automatisch nonct;
das **Root**-Layout liest den Nonce über `headers().get('x-nonce')` und hängt ihn ans einzige
eigene Inline-Skript. Folgen: `style-src` behält `'unsafe-inline'` (next/font + Next injizieren
Inline-Styles); das Root-Layout ist durch `headers()` **dynamisch** (kein statisches Prerender mehr). Wer
ein weiteres Inline-`<script>` ergänzt, muss ihm den Nonce mitgeben, sonst blockt Prod es.

## Bekannte Randbedingungen

- **Node 20.19.4** im Einsatz: `openai` ist deshalb auf 6.x gepinnt — 7.x verlangt Node ≥ 22.
  Bei einem Node-Upgrade kann auf `openai@7` gewechselt werden.
- **Next 16 verwarnt `middleware.ts`** und möchte `proxy.ts`. Die Datei bleibt bewusst beim
  Blueprint-Namen; Migration wäre `npx @next/codemod@canary middleware-to-proxy .` — das ist
  eine Entscheidung für später, nicht eigenmächtig umbenennen.
- **`agentRules: false`** in `next.config.mjs`: sonst hängt Next 16 bei jedem `next dev` einen
  selbst-erneuernden `nextjs-agent-rules`-Block an diese Datei. CLAUDE.md bleibt handgepflegt.
- **`app/[locale]/layout.tsx`:** `params` muss `Promise<{locale: string}>` bleiben — Next 16
  validiert die Layout-Props gegen die generierten Route-Typen. Verengung auf `Locale` nur in
  Pages möglich; im Layout narrowt `hasLocale()`.
- **`templates/`** ist aus `tsconfig.json`, Prettier und Stylelint ausgeschlossen, damit die
  doppelte `declare module 'next-intl'` keinen Konflikt erzeugt.
- **PDF-Schriften liegen als WOFF in [assets/fonts/](assets/fonts):** `fontkit` (in
  `@react-pdf/renderer`) liest **kein WOFF2**, und IBM Plex gibt es auf npm nicht als TTF.
  Die Dateien kommen aus `@ibm/plex-sans` / `@ibm/plex-mono` (`fonts/complete/woff`) — die
  **Subsets von `@fontsource/*` scheitern** beim Parsen („Offset is outside the bounds of the
  DataView"). `assets/portrait-print.jpg` ist die einmalig nach Graustufe konvertierte
  Fassung von `public/portrait.jpg` (CSS-Filter gibt es im PDF nicht).
- **`next.config.mjs`** braucht dafür beides: `serverExternalPackages` für den Renderer und
  `outputFileTracingIncludes` für `./assets/**`, weil die Route die Dateien erst zur Laufzeit
  über `process.cwd()` liest.
- **`qrcode-generator`** ist die einzige neue Laufzeit-Abhängigkeit (kein eigenes `node_modules`,
  eigene Typen, MIT). Sie liefert nur die Modul-Matrix; das Zeichnen macht `lib/pdf/qr.ts`.
- **Zwei Eigenheiten von `@react-pdf/renderer`** (beide teuer erkauft, nicht „aufräumen"):
  `fixed`-Elemente müssen **vor** dem Seiteninhalt stehen, sonst werden sie nicht gezeichnet;
  und ein dynamischer Textknoten (`render`-Prop) darf nicht mit `bottom` positioniert werden —
  beim Paginieren wird seine Box auf Höhe 0 gesetzt. Deshalb hängt der Seitenfuß über
  `theme.foot` an `top`.
