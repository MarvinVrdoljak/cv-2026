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
  ([lib/cvContext.ts](lib/cvContext.ts)). ⚠ Zwei Datumsangaben (exp-01, exp-02) sind
  geschätzt und im Datei-Kopf markiert.
- **API-Route:** [app/api/assistant/route.ts](app/api/assistant/route.ts) — ein POST-Endpunkt
  für `matching | chat | summary`, Node-Runtime, streamt über die Web-Streams-API. Key
  serverseitig ([lib/openai.ts](lib/openai.ts)). Rate-Limit pro Session-Cookie + Tagesdeckel
  ([lib/rateLimit.ts](lib/rateLimit.ts)), Längenbegrenzung je Modus.
- **Systemprompts:** [lib/prompts.ts](lib/prompts.ts) — drei Prompts, alle mit demselben
  Vertrag: nur aus den CV-Daten, fehlende Info offen sagen, Einträge per id zitieren, knapp,
  Prompt-Probing/Off-Topic trocken abweisen. Matching gibt **NDJSON** aus (eine `order`-Zeile
  und je eine `finding`-Zeile, buckets fit/partial/gap), der Client parst zeilenweise beim
  Streamen. Chat/Zusammenfassung streamen Prosa mit `[id]`-Zitaten.
- **Client-Zustand:** [components/app/AppState.tsx](components/app/AppState.tsx) — ein Provider
  hält Matching/Chat/Summary/Status, persistiert Chat + Anzeige in `localStorage` (übersteht
  Reload), und fährt die DOM-Effekte: `data-highlight` bei Hover/Klick, `order` +
  **FLIP-Animation** für die Umsortierung ([lib/dom.ts](lib/dom.ts)). `[id]`-Zitate werden
  über [RefText](components/app/RefText.tsx)/[EntryRef](components/app/EntryRef.tsx) zu
  interaktiven Chips (Hover leuchtet, Klick scrollt).
- **Adressierbarkeit:** Jeder Eintrag rendert mit `id={entry.id}` **und** `data-entry={id}`.
  Matching/Chat setzen `data-highlight="true"` (Aufleuchten als CSS-Transition) und `order`
  auf den Experience-Flex-Items.
- **Notiz-Mitschrift:** native Checkboxen (`[data-mark]`) in `<form id="cv-marks">`; CSS-Counter
  `marks` speist Zähler, `:has()` blendet die Leiste ein, `type="reset"` (`form="cv-marks"`)
  leert alles — **ohne JS**. Die Zusammenfassung liest die markierten ids
  ([SummaryDialog](components/app/SummaryDialog.tsx)), streamt eine Einordnung, bietet Kopieren
  und eine Druckansicht.
- **Chrome:** [components/shell/](components/shell) — feste Mono-Leisten, Statuszeile mit
  echten Readouts (State/Modell/Antwortzeit live aus dem Stream, `—` solange nichts lief),
  Tastaturkürzel (⌘/Ctrl K, „/", Esc) über `KeyBindings`.
- **Typografie:** IBM Plex Sans (Inhalt) + IBM Plex Mono (Interface) via `next/font`. Der
  Sans/Mono-Wechsel trennt Inhalt von Interface. Zeilenlänge geprüft auf ~70 Zeichen
  (`--measure: 56ch`; `1ch` = Breite der „0", breiter als das Durchschnittszeichen).
- **Farbe/Motion:** ein Akzent nur für aktive Zustände; Palette rechnerisch gegen WCAG AA
  geprüft (Light + Dark). Motion 150–250 ms mit eigenen Kurven, `prefers-reduced-motion`
  global respektiert. Dark Mode folgt der Umgebung (kein Umschalter — laut Briefing verboten).
- **Print:** [styles/print.css](styles/print.css) blendet das Interface aus; `data-print`-Haken
  markieren, was Dokument bleibt.

## Konventionen (aus dem Blueprint)

- **CSS:** Kein Framework, keine Component-Library. Pro Komponente ein CSS Module mit einer
  expliziten Klasse pro Element — keine Descendant-Selektoren.
- **Tokens:** Farben, Spacing, Radien, Schriftgrößen ausschließlich über `var(--…)` aus
  `styles/base/tokens.css`. Keine Hex-Werte außerhalb dieser Datei (Stylelint bricht sonst ab).
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
Optional: `OPENAI_MODEL` (Default `gpt-4o-mini`). Ohne Key liefert die Route `503` und die
Oberfläche zeigt „KI-Funktionen nicht konfiguriert".

**Dev-Mock:** Ohne Key und mit `ASSISTANT_MOCK=1` (nur `NODE_ENV!==production`) streamt die
Route ein klar mit `[DEV-MOCK]` gekennzeichnetes Skript — zum Testen der Interaktionen ohne
Key/Kosten. In Produktion immer aus.

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
