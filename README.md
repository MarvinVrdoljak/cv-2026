# CV

Interaktive CV-Anwendung. Next.js (App Router), TypeScript, next-intl, eigenes CSS mit
Custom Properties — kein CSS-Framework.

## Setup

```bash
npm install
```

Dann `.env.local` im Projektwurzelverzeichnis anlegen:

```
OPENAI_API_KEY=sk-...
```

## Entwicklung

```bash
npm run dev
```

Erreichbar unter `http://localhost:3000` (Deutsch) und `/en` (Englisch).

## Prüfen

```bash
npm run typecheck && npm run lint:css && npm run build
```

## Struktur

| Pfad            | Inhalt                                               |
| --------------- | ---------------------------------------------------- |
| `app/[locale]/` | Routen, ein Layout und eine Seite pro Locale         |
| `components/`   | React-Komponenten, je mit eigenem CSS Module         |
| `i18n/`         | Locale-Konfiguration, Navigation und Übersetzungen   |
| `styles/`       | Design Tokens, Base-Layer, Utilities, globale Atoms  |
| `docs/`         | Projektbeschreibung                                  |
| `templates/`    | Code-Blueprint, aus dem das Projekt aufgesetzt wurde |

Konventionen und Randbedingungen stehen in [CLAUDE.md](CLAUDE.md).
