# F16 — Export Excel — Design

- **Date** : 2026-09-30
- **Ticket** : [#16](https://github.com/AdrienGras/questionator-z4000-hyperdrive/issues/16)
- **Branche** : `feat/f16-excel-export`
- **Statut** : spec validée en conversation, figée ici avant le plan d'implémentation.

## Contexte

Plusieurs examinateurs font passer les oraux en parallèle ; la consolidation se fait hors de l'outil, par copier-coller entre classeurs (D11 : l'examinateur est une colonne, pas seulement une métadonnée). D35 retient write-excel-file (`write-excel-file/browser`), valeurs sans formules, chargé à la demande. F15 fournit `computeStats(session): SessionStats` (`src/domain/stats/`, D70) ; F03 fournit `computeScores` et `exportedFinal` (valeur absent selon `absent.export`, `null` si non terminé). Le `slugify` du nom de backup vit dans `src/domain/backup/serialize.ts`. F15 a posé le patron « bibliothèque lourde confinée » : groupe `codeSplitting` nommé, `pnpm check:bundle` sur le manifeste avec garde de non-vacuité, règle dependency-cruiser (CONVENTIONS § « Module lourd chargé à la demande », QUIRKS 2026-09-30).

## Objectif

Un bouton « Exporter en Excel » dans l'onglet « Étudiants » qui télécharge `<slug-session>-<AAAA-MM-JJ>.xlsx` : cinq onglets aux valeurs typées (nombres, dates), aucune formule, libellés dans la langue de la session ; write-excel-file hors du bundle initial.

## Décisions (D71)

- **`buildWorkbook` pur dans `src/domain/export/`** (et non `src/export/`, D59), qui produit une description neutre (`WorkbookSpec`) sans importer write-excel-file. **`lib/xlsx/write-workbook.ts`** est le seul importeur de `write-excel-file/browser` et traduit la description. **`features/session/export-workbook.ts`** orchestre (stats, description, `import()` dynamique, téléchargement).
- **Langue** passée explicitement (`ui.locale` de l'écran, qui tient déjà compte de `config.locale`).
- **Dates en heure locale** : write-excel-file écrit une `Date` selon ses composantes UTC ; `lib/xlsx` décale chaque date de `getTimezoneOffset()` pour que l'heure affichée soit l'heure murale de l'examinateur.
- **Formats** : convertie, ajustement, finale (et valeur absent numérique) au format du pas (`0`, `0.0`, `0.00`, `0.000`) ; brute, plafonnée, points et points max au format général (jusqu'à 3 décimales, sans « 12. ») ; taux en `0.0%` ; moyennes, médiane, écart-type en `0.00`.
- **Aucune formule par construction** : le type `Cell` n'en exprime pas ; un texte saisi « =1+1 » est écrit en `String`.
- **`check:bundle` généralisé** à une liste de cibles `{ name, chunk, importer }` : Recharts (importé par la route des stats) et write-excel-file (importé par le chunk de `lib/xlsx/write-workbook.ts`) ; groupe `codeSplitting` `xlsx` ; règle dependency-cruiser `xlsx-only-in-lib-xlsx`.

## Architecture

```
src/domain/export/
  types.ts            Cell, SheetSpec, WorkbookSpec
  formats.ts          scoreFormat(config), constantes de format (RATE, DECIMAL_2, dateFormat(locale))
  messages.ts         libellés d'onglets, en-têtes, statuts, résultats, clés de Configuration/Métadonnées (fr, en)
  summary-sheet.ts    Synthèse
  detail-sheet.ts     Détail des questions
  stats-sheet.ts      Statistiques
  config-sheet.ts     Configuration
  metadata-sheet.ts   Métadonnées
  build-workbook.ts   buildWorkbook(session, stats, locale, now): WorkbookSpec
  file-name.ts        workbookFileName(session, now): string
src/lib/xlsx/write-workbook.ts        writeWorkbook(spec, fileName): Promise<void>
src/features/session/export-workbook.ts   exportWorkbook(session, locale): Promise<void>
src/features/session/components/export-button.tsx
```

`slugify` et la date locale `AAAA-MM-JJ` sortent de `domain/backup/serialize.ts` vers `domain/session/file-name.ts` (ou équivalent partagé), réutilisés par le backup et l'export. `stepDecimals` est exporté de `domain/scoring/format.ts` pour `scoreFormat`.

## Modèle neutre

```ts
type Cell =
  | { kind: 'text'; value: string; bold?: boolean }
  | { kind: 'number'; value: number; format?: string }
  | { kind: 'date'; value: Date; format: string }
  | null
type SheetSpec = { name: string; columns: { width: number }[]; rows: Cell[][]; stickyRows?: number }
type WorkbookSpec = SheetSpec[]
```

Les lignes d'en-têtes et les titres de bloc sont en `bold`. `null` = cellule vide.

## Onglets

| Onglet | Contenu | Figé |
|---|---|---|
| Synthèse | Examinateur · Nom · Prénom · Ordre · Statut (Terminé / En cours / À passer / Absent) · Ajouté en cours de session (Oui / Non) · Brute · Plafonnée · Convertie · Ajustement · Justification · Finale · Commentaire ; une ligne par étudiant, tri par `order` | 1 |
| Détail des questions | Examinateur · Étudiant (« Nom Prénom ») · Rang (1-based dans `attempts`) · Catégorie (libellé ; id si inconnue) · Id question · Titre (vide si inconnue) · Tags (`, `) · Résultat (Noté / Passé / En cours) · Points · Points max (`max(scale)`) · Motif · Tirée le · Modifiée le ; une ligne par attempt, tri par `order` puis rang ; un étudiant sans attempt n'y figure pas | 1 |
| Statistiques | blocs de `SessionStats` dans l'ordre de l'écran F15 (effectifs, notes finales, histogramme, catégories, tags, questions les plus tirées, questions passées, stratégies, ajustements) : ligne de titre en gras, ligne d'en-têtes, lignes, ligne vide entre blocs ; histogramme en « Intervalle / Effectif » (`[a ; b[`, dernier `[a ; b]`) ; motifs sur une cellule « Hors programme ×2, sans motif ×1 » ; composition « Facile ×2 · Difficile ×1 » ; `null` → vide | — |
| Configuration | bloc Catégories (Libellé · Id · Ordre · Questions · Barème « 0 ; 0,5 ; 1 ») puis paires clé → valeur : questions par étudiant, note brute max, échelle finale, arrondi (mode, pas effectif), skips (activés, max par étudiant, motifs, texte libre), absent (mode, libellé, valeur), version du schéma | — |
| Métadonnées | paires clé → valeur : nom de session, examinateur, titre de l'examen, matière, promo, créée le (date), exportée le (date), version de l'application | — |

- **Notes** : `computeScores` pour brute, plafonnée, convertie, ajustement ; `exportedFinal` pour la finale. Absent : finale texte (`label`) ou nombre (`zero`, `value`), convertie vide, ajustement vide. Étudiant non terminé : convertie et finale vides. Ajustement vide si l'étudiant n'en a pas.
- **Dates** : `drawnAt`, `editedAt`, `createdAt`, date d'export ; format `dd/mm/yyyy hh:mm` (fr) ou `yyyy-mm-dd hh:mm` (en). `editedAt` absent → vide.
- **Largeurs** : ~12 pour les nombres et dates courtes, 16–18 pour les dates, 24–40 pour les textes.
- **Noms d'onglets** : ≤ 31 caractères, sans `: \ / ? * [ ]` (contrainte Excel) ; les libellés fr/en le respectent, un test le vérifie.

## Génération et bouton

- `writeWorkbook(spec, fileName)` : traduit chaque `Cell` (`text` → `{ value, type: String, fontWeight }`, `number` → `{ value, type: Number, format }`, `date` → `{ value: décalée, type: Date, format }`, `null` → `null`), passe `{ sheet, columns, stickyRowsCount }` par onglet, puis `.toFile(fileName)`. Fonction de traduction `toSheetData` exportée et testée sans la bibliothèque.
- `exportWorkbook(session, locale)` : `computeStats` → `buildWorkbook(…, new Date())` → `await import('@/lib/xlsx/write-workbook')` → `writeWorkbook`. Rejette si le chunk ou l'écriture échoue.
- `ExportButton` dans l'`actionsSlot` de `StudentsTab`, à côté de « Statistiques » : `IconFileSpreadsheet`, « Exporter en Excel » ; pendant l'export, désactivé et « Export en cours… » ; en cas d'échec, message traduit (`role="alert"`) « L'export a échoué. Réessayez. » sous le bouton.

## Frontières

- Règle dependency-cruiser `xlsx-only-in-lib-xlsx` : `write-excel-file` ne s'importe que depuis `src/lib/xlsx/`.
- `@/lib/xlsx/write-workbook` n'est importé qu'en dynamique : le chunk qui le contient ne doit pas être atteint statiquement depuis `index.html`.
- `vite.config.ts` : groupe `codeSplitting` `xlsx` (`write-excel-file`, `fflate`), placé avant ou après `recharts` selon les dépendances partagées ; la liste blanche `vendor` s'étend si `check:bundle` le demande.
- `scripts/check-initial-bundle.ts` : cibles `[{ name: 'recharts', chunk: /^_recharts[.-]/, importer: 'src/routes/session.$sessionId_.stats.tsx?tsr-split=component' }, { name: 'xlsx', chunk: /^_xlsx[.-]/, importer: 'src/lib/xlsx/write-workbook.ts' }]` ; pour chaque cible, garde de non-vacuité puis absence du chunk dans le graphe statique initial.

## Erreurs et cas limites

- Session sans étudiant : Synthèse et Détail réduits aux en-têtes, Statistiques avec des cellules vides.
- Question ou catégorie d'id inconnu (backup incohérent) : l'id est écrit, le titre est vide, rien ne plante.
- Nom de session vide ou sans caractère alphanumérique : slug de repli `session`.
- Texte commençant par `=`, `+`, `-`, `@` : écrit en `String`, jamais interprété.

## Tests

- `buildWorkbook` : cinq onglets dans l'ordre et noms valides ; colonnes de Synthèse et Détail dans l'ordre, en fr et en en ; notes en `number` ; absent `label` → texte, `zero` → 0, `value` → la valeur ; étudiant en cours et à passer → convertie et finale `null` ; motif de skip et justification présents ; dates `kind: 'date'` avec le format de la langue ; aucune cellule `text` issue d'une note ; « =1+1 » reste `text` ; `scoreFormat` pour un pas de 1, 0,5, 0,25 et `decimals: 2` ; Détail trié par ordre puis rang ; Statistiques : un titre par bloc et lignes vides entre blocs, taux au format `0.0%`.
- `workbookFileName` : slug, date locale, repli `session`.
- `toSheetData` : traduction des quatre sortes de cellules, décalage horaire des dates (fuseau simulé), `stickyRowsCount`.
- `ExportButton` : clic → `exportWorkbook` appelé avec la session et la langue ; état occupé ; message d'erreur sur rejet.
- `check:bundle` : cibles multiples, vacuité par cible, fuite détectée pour chacune.
- e2e : clic sur « Exporter en Excel » → téléchargement nommé `session-e2e-<date>.xlsx`, contenu commençant par `PK`.
- Vérification manuelle : LibreOffice headless (`soffice --headless --convert-to csv`) par onglet, valeurs et types relus ; Excel par le propriétaire du dépôt, consigné dans la PR.

## Critères d'acceptation

- [ ] Le fichier s'ouvre sans avertissement dans Excel et LibreOffice (vérification manuelle, consignée dans la PR).
- [ ] Les notes y sont des nombres, pas du texte, sauf la valeur absent en mode `label`.
- [ ] Le motif de skip (F10) et la justification d'ajustement (F11) apparaissent dans l'export.
- [ ] write-excel-file n'est pas dans le bundle initial (`pnpm check:bundle` en CI).

## Hors périmètre

- Pré-cache du chunk (F17). Autofiltre. Export depuis l'accueil.
