# Build-Prompt: Interaktive CV-Anwendung

---

## Kontext

Baue eine persönliche CV-Anwendung für einen Senior Frontend Developer mit Designhintergrund, der sich in Deutschland auf Festanstellungen bewirbt. Zielgruppe sind Recruiter und technische Entscheider.

Die Anwendung soll sich wie ein Werkzeug anfühlen, nicht wie eine Website. Kein Hero, kein Scrollytelling, keine Landingpage-Dramaturgie. Der Eindruck soll sein: hier hat jemand ein Interface gebaut, kein Dokument veröffentlicht.

**Stack:** Next.js (App Router), TypeScript, OpenAI API mit Streaming. Kein CSS-Framework — eigenes CSS mit Custom Properties. Keine Component-Library.

---

## Die vier Funktionen

### 1. Der CV

Ohne Interaktion sofort vollständig lesbar. Wer nur scannen will, ist in 40 Sekunden fertig.

Struktur: Kopf, Kurzprofil, Berufserfahrung (antichronologisch), Kenntnisse nach Kategorien, Ausbildung, Sprachen.

Jede Station und jeder Kenntnisblock ist ein adressierbares Element mit stabiler ID — die anderen drei Funktionen referenzieren darauf.

### 2. Matching

Ein Eingabefeld über dem CV: Stellenanzeige einfügen.

Nach dem Absenden:
- Analyse per OpenAI, gestreamt
- Ergebnis erscheint über dem CV in drei Blöcken: **Was passt** · **Was teilweise passt** · **Was fehlt**
- Jeder Punkt verweist auf konkrete CV-Elemente; bei Hover leuchtet die Stelle im CV auf, bei Klick scrollt die Seite dorthin
- Der CV sortiert sich um: relevante Stationen wandern nach oben, irrelevante bleiben lesbar, treten aber zurück
- Der Zustand ist zurücksetzbar

**Kritisch:** Der Block „Was fehlt" muss ehrlich sein. Wenn eine Stellenanzeige schlecht passt, muss das Ergebnis das sagen. Der Systemprompt muss das explizit erzwingen — Modelle neigen dazu, gefallen zu wollen, und ein Matching, das bei jeder Anzeige begeistert ist, entwertet die gesamte Anwendung.

### 3. Chat

Permanent verfügbar, nicht als aufklappbares Widget.

- Desktop: eigene Spalte rechts, immer sichtbar
- Mobil: Eingabefeld am unteren Rand, das beim Fokus aufgeht
- Vorgeschlagene Fragen als Chips, die sich nach der aktuell sichtbaren CV-Sektion richten
- Nach einem Matching kennt der Chat die Stellenanzeige und schlägt entsprechende Fragen vor
- Antworten streamen sichtbar Token für Token
- Antworten verweisen auf CV-Elemente, gleiche Hover- und Klick-Logik wie beim Matching
- Verlauf übersteht einen Reload

### 4. Notiz-Mitschrift

Jedes CV-Element und jede Chat-Antwort lässt sich markieren.

- Markierte Elemente sammeln sich in einer unaufdringlichen Leiste mit Zähler
- Am Ende: Zusammenfassung erzeugen — die markierten Stellen plus eine kurze, per OpenAI generierte Einordnung
- Ausgabe als Text zum Kopieren und als druckbare Ansicht
- Kein E-Mail-Versand, kein Formular, keine Datenerfassung

---

## Gestaltung

**Grundhaltung:** Subtil, aber unverwechselbar. Der Anspruch ist Auszeichnungsniveau — erreicht durch Präzision, nicht durch Effekte. Wenn ein Detail auffällt, weil es laut ist, ist es falsch.

**Typografie trägt alles.** Eine Serifenlose mit Charakter, ergänzt um eine Monospace für Metadaten, Datumsangaben, Zähler und Systemtexte. Der Wechsel zwischen beiden ist das zentrale gestalterische Mittel: Er unterscheidet Inhalt von Interface.

Hierarchie über Größe, Gewicht und Abstand — nicht über Farbe. Modulare Skala. Zeilenlänge im CV bei 65 bis 75 Zeichen. Optisch ausgeglichene Abstände statt mathematisch gleicher.

**Farbe minimal.** Ein nahezu neutraler Hintergrund, ein sehr dunkler Textton, ein einziger Akzent. Der Akzent erscheint ausschließlich bei aktiven Zuständen: hervorgehobene CV-Stellen, markierte Elemente, Streaming-Indikator. Nirgends dekorativ.

**Software-Anmutung erzeugen durch:**
- Ein sichtbares, aber ruhiges Raster
- Feine Trennlinien statt Karten und Schatten
- Eine schmale Statusleiste am unteren Rand mit Systeminformationen in Monospace (Modell, Antwortzeit, Anzahl Markierungen)
- Tastaturbedienung durchgehend, mit sichtbaren Kürzeln
- Dichte, präzise Zustandsanzeigen statt Sprechblasen-Ästhetik

**Bewegung:** Kurz, präzise, funktional. 150 bis 250 Millisekunden, eigene Easing-Kurven, keine Standardwerte. Animiert wird nur, was einen Zustandswechsel erklärt — die Umsortierung des CV beim Matching, das Aufleuchten referenzierter Stellen, das Erscheinen gestreamter Zeichen. Kein Scroll-Trigger, kein Parallax, keine Einblendungen beim Laden. `prefers-reduced-motion` respektieren.

Die Umsortierung beim Matching ist der wichtigste Moment der gesamten Anwendung: Sie muss nachvollziehbar sein, nicht überraschend. Positionswechsel als echte Bewegung, nicht als Neuaufbau.

---

## Technische Anforderungen

**API-Route** für OpenAI-Aufrufe, Streaming über die Web-Streams-API. Der Schlüssel bleibt serverseitig.

**Drei Systemprompts:** Matching, Chat, Zusammenfassung. Alle drei bekommen den CV als strukturiertes JSON. Alle drei müssen:
- Ausschließlich auf Basis der übergebenen Daten antworten
- Bei fehlender Information sagen, dass die Information nicht vorliegt, statt zu ergänzen
- Auf CV-Element-IDs verweisen, damit die Oberfläche sie hervorheben kann
- Knapp bleiben

**Schutzmaßnahmen:** Rate-Limit pro Session, harter Tagesdeckel, Längenbegrenzung der Eingabe. Versuche, den Systemprompt auszulesen oder das Thema zu verlassen, werden trocken abgewiesen — nicht belehrend.

**Barrierefreiheit ist nicht optional.** Vollständige Tastaturbedienung, sichtbare Fokusindikatoren, korrekte Landmarks, gestreamter Text in einer Live-Region. Kontraste nach WCAG AA. Die Anwendung soll sich als Beleg für Barrierefreiheitskompetenz eignen.

**Ohne JavaScript** bleibt der CV lesbar. Die drei interaktiven Funktionen sind Erweiterung, nicht Voraussetzung.

**Daten:** Der CV liegt als einzelne strukturierte Datei vor, aus der sowohl die Darstellung als auch der Modellkontext gespeist werden. Eine Quelle, keine Duplikate.

---

## Was ausdrücklich nicht gebaut wird

Kein Avatar, kein Gesicht, keine Sprachausgabe. Keine Fortschrittsbalken für Kenntnisse. Keine Icons in der Navigation. Kein Dark-Mode-Umschalter als Feature. Keine Zeugnisse, keine Logo-Leiste. Kein Ladebildschirm. Keine Cookie-Banner, weil nichts getrackt wird, das einen erfordert.
