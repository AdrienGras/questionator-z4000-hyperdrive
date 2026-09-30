# F16 — Export Excel — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** un bouton « Exporter en Excel » qui télécharge un `.xlsx` de cinq onglets typés, sans formule, write-excel-file hors du bundle initial.

**Architecture:** `buildWorkbook` pur dans `src/domain/export/` produit une description neutre (`WorkbookSpec`) ; `src/lib/xlsx/write-workbook.ts` la traduit pour `write-excel-file/browser` ; `src/features/session/export-workbook.ts` orchestre et charge `lib/xlsx` en `import()` dynamique ; le bouton vit dans l'`actionsSlot` de l'onglet « Étudiants ».

**Tech Stack:** TypeScript, React 19, Vitest + Testing Library, write-excel-file (browser), Vite 8/Rolldown `codeSplitting`, dependency-cruiser, Playwright.

**Spec:** `docs/superpowers/specs/2026-09-30-f16-excel-export-design.md` (décision D71). Ses tableaux « Onglets » et « Décisions » font foi pour les colonnes, formats et libellés.

## Global Constraints

- Arborescence D59 (`docs/CONVENTIONS.md` § « Arborescence et imports ») : imports `@/…`, pas de `../`, pas de barrel, kebab-case, tests colocalisés ; `domain/` sans React, sans `lib/db/`, sans `lib/i18n/use-ui.ts` ; dictionnaire de domaine via `t` de `@/lib/i18n/i18n` (modèle : `src/domain/passage/messages.ts`) ; `pnpm deps` vert.
- Notes : uniquement via `computeScores` / `exportedFinal` / `fromMilli` (`src/domain/scoring/`) ; aucune arithmétique de note ailleurs.
- Libellés d'onglets, en-têtes, statuts et résultats dans la langue passée (`Locale`), fr **et** en.
- Aucune formule : le type `Cell` n'en exprime pas ; tout texte est écrit en `String`.
- Formats : convertie, ajustement, finale, valeur absent numérique = `scoreFormat(config)` (`0`, `0.0`, `0.00`, `0.000` selon les décimales du pas) ; brute, plafonnée, points, points max = format général (pas de `format`) ; taux `0.0%` ; moyennes/médiane/écart-type `0.00` ; dates `dd/mm/yyyy hh:mm` (fr) / `yyyy-mm-dd hh:mm` (en).
- Commits gitmoji en français, terminés par `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` et `Claude-Session: https://claude.ai/code/session_011GaMaWoWjBN7xkjiNij3Jx`.
- Tests ciblés : `rtk proxy npx vitest run <fichiers>` (`rtk vitest` ne lit pas la sortie ici). `noUncheckedIndexedAccess` actif ; oxlint type-aware strict (`toSorted`…).
- Chaque tâche finit avec `rtk pnpm check` vert.

## Review Focus

1. **Heure d'été / d'hiver** : un tirage à `2026-03-29T00:30:00Z` (veille du changement d'heure en France) et un autre en été doivent chacun s'écrire à l'heure murale locale de leur propre date — le décalage se calcule par date (`date.getTimezoneOffset()`), jamais une fois pour toutes. → test dans la tâche 4 (fuseau `Europe/Paris` simulé via `process.env.TZ` ou un `offsetOf` injecté).
2. **Texte d'apparence formule** (`=1+1`, `+33…`, `@sum`) dans un commentaire, un motif ou un nom : reste une cellule `text`. → test dans la tâche 1 (Synthèse) et la tâche 4 (traduction en `String`).
3. **Absent en mode `value` avec une valeur décimale** (ex. 5,5 sur un pas de 0,5) : cellule nombre au format du pas, pas du texte. → test dans la tâche 1.
4. **Question ou catégorie d'id inconnu** : le Détail écrit les ids, titre et libellé vides, points max vides, sans lever. → test dans la tâche 2.
5. **Nom de session sans caractère alphanumérique** (« — ») : fichier `session-<date>.xlsx`. → test dans la tâche 1.

---

### Task 1: Modèle, formats, nom de fichier, dictionnaire et onglet Synthèse

**Files:**
- Create: `src/domain/export/types.ts`, `formats.ts`, `messages.ts`, `file-name.ts`, `summary-sheet.ts`, `src/domain/session/file-name.ts` (slug et date locale partagés)
- Modify: `src/domain/scoring/format.ts` (exporter `stepDecimals`), `src/domain/backup/serialize.ts` (utiliser le slug partagé)
- Test: `formats.test.ts`, `file-name.test.ts`, `summary-sheet.test.ts`, `messages.test.ts` dans `src/domain/export/` ; `src/domain/session/file-name.test.ts` ; les tests existants de `serialize` restent verts

**Interfaces:**
- Produces:
  - `types.ts` : `Cell`, `SheetSpec`, `WorkbookSpec` exactement comme la spec (§ « Modèle neutre »).
  - `formats.ts` : `scoreFormat(config: NormalizedConfig): string`, `RATE_FORMAT = '0.0%'`, `DECIMAL_2_FORMAT = '0.00'`, `dateFormat(locale: Locale): string`.
  - `src/domain/session/file-name.ts` : `slugify(name: string): string` (repli `'session'` si vide), `localDateStamp(now: Date): string` (`AAAA-MM-JJ` local). `backupFileName` les réutilise ; son comportement actuel ne change pas, sauf le repli `session` si le slug est vide (vérifier le test existant ; si le backup avait déjà un repli, garder le sien).
  - `file-name.ts` : `workbookFileName(session: Session, now: Date): string` → `<slug>-<AAAA-MM-JJ>.xlsx`.
  - `messages.ts` : `exportText(locale, key, params)` sur un dictionnaire typé fr/en qui contient **toutes** les clés des cinq onglets (noms d'onglets, en-têtes, statuts, résultats, oui/non, titres de blocs Statistiques, clés de Configuration et Métadonnées, « sans motif », `times` « {label} ×{count} »). Les tâches 2–3 n'ajoutent pas de clé sans l'y mettre en fr et en.
  - Helpers de cellule (dans `types.ts` ou `cells.ts`) : `text(value, bold?)`, `num(value, format?)`, `date(value, format)`, `header(labels: string[]): Cell[]` (gras).
  - `summary-sheet.ts` : `summarySheet(session: Session, locale: Locale): SheetSpec`.

- [ ] **Step 1: Tests**
  - `scoreFormat` : pas 1 → `'0'` ; `step: 0.5` → `'0.0'` ; `step: 0.25` → `'0.00'` ; `decimals: 2` sans step → `'0.00'` ; `decimals: 3` → `'0.000'`.
  - `dateFormat('fr')` → `'dd/mm/yyyy hh:mm'`, `dateFormat('en')` → `'yyyy-mm-dd hh:mm'`.
  - `workbookFileName` : « Oral PHP — Jury 2 » au 2026-09-30 → `'oral-php-jury-2-2026-09-30.xlsx'` ; nom « — » → `'session-2026-09-30.xlsx'`.
  - `messages.test.ts` : chaque clé fr a son pendant en ; les noms d'onglets font ≤ 31 caractères et ne contiennent aucun de `: \ / ? * [ ]`.
  - `summarySheet` (fr) : ligne 0 = en-têtes en gras dans l'ordre de la spec (13 colonnes) ; `stickyRows: 1` ; une ligne par étudiant triée par `order` ; terminé → brute/plafonnée `number` sans format, convertie/ajustement/finale `number` au `scoreFormat` ; en cours et à passer → convertie et finale `null`, statut « En cours » / « À passer » ; absent `label` → finale `text` du libellé, `zero` → `num(0)`, `value: 5.5` (pas 0,5) → `num(5.5, '0.0')` ; justification et commentaire présents ; commentaire « =1+1 » → cellule `text` ; examinateur répété sur chaque ligne, vide si absent ; « Oui » / « Non » pour ajouté en cours de session ; en-têtes en anglais avec `'en'`.
- [ ] **Step 2: Lancer** → FAIL.
- [ ] **Step 3: Implémenter.** Colonnes et largeurs selon la spec (§ « Onglets », « Largeurs »).
- [ ] **Step 4: Lancer** → PASS ; `rtk pnpm check`.
- [ ] **Step 5: Commit** `✨ Ajoute le modèle de classeur et l'onglet Synthèse de l'export`.

### Task 2: Onglets Détail des questions, Configuration et Métadonnées

**Files:**
- Create: `src/domain/export/detail-sheet.ts`, `config-sheet.ts`, `metadata-sheet.ts`
- Test: `detail-sheet.test.ts`, `config-sheet.test.ts`, `metadata-sheet.test.ts`

**Interfaces:**
- Consumes: tâche 1 (types, helpers, formats, `exportText`).
- Produces: `detailSheet(session, locale): SheetSpec`, `configSheet(session, locale): SheetSpec`, `metadataSheet(session, locale, now: Date): SheetSpec`.

- [ ] **Step 1: Tests**
  - Détail : en-têtes dans l'ordre de la spec (13 colonnes), `stickyRows: 1` ; deux étudiants d'`order` 2 puis 1 → lignes de l'étudiant 1 d'abord, rang 1, 2, 3 ; noté → points `number`, points max `max(scale)` ; passé → résultat « Passé », points vides, motif présent ; pending → « En cours » ; tags joints par `, ` ; `drawnAt` → cellule `date` au format de la langue ; `editedAt` absent → `null` ; étudiant sans attempt → aucune ligne ; question et catégorie d'id inconnu → ids écrits, libellé et titre `null`, points max `null`, sans lever (Review Focus 4).
  - Configuration : bloc Catégories avec en-têtes et une ligne par catégorie (barème « 0 ; 0,5 ; 1 » en fr, « 0; 0.5; 1 » en en) ; puis paires clé → valeur pour chaque réglage listé dans la spec, valeurs numériques en `number`, booléens en Oui/Non, motifs de skip joints par `, `.
  - Métadonnées : paires clé → valeur ; `createdAt` et `now` en `date` ; matière et promo absentes → `null`.
- [ ] **Step 2: Lancer** → FAIL ; **Step 3: Implémenter** ; **Step 4: Lancer** → PASS ; `rtk pnpm check`.
- [ ] **Step 5: Commit** `✨ Ajoute les onglets Détail, Configuration et Métadonnées de l'export`.

### Task 3: Onglet Statistiques et `buildWorkbook`

**Files:**
- Create: `src/domain/export/stats-sheet.ts`, `build-workbook.ts`
- Test: `stats-sheet.test.ts`, `build-workbook.test.ts`

**Interfaces:**
- Consumes: tâches 1–2 ; `SessionStats` et sous-types de `src/domain/stats/types.ts` ; `computeStats` de `src/domain/stats/compute-stats.ts`.
- Produces: `statsSheet(session: Session, stats: SessionStats, locale: Locale): SheetSpec` ; `buildWorkbook(session: Session, stats: SessionStats, locale: Locale, now: Date): WorkbookSpec` (ordre : Synthèse, Détail, Statistiques, Configuration, Métadonnées).

La mise en forme des intervalles et des motifs reprend les règles de l'écran F15 (`src/features/stats/format-stats.ts` : `binLabel`, motifs « ×n », composition « · ») ; comme `domain/` ne peut pas importer `features/`, réécrire ces petites fonctions dans `domain/export/` avec leurs tests, ou — si elles sont pures et sans React — les déplacer dans `domain/stats/labels.ts` et faire importer l'écran depuis là (préféré : une seule source).

- [ ] **Step 1: Tests**
  - Statistiques : neuf titres de bloc en gras, dans l'ordre de la spec, séparés par une ligne vide (`[]`) ; effectifs et notes en `number` (moyenne/médiane/écart-type `0.00`, min/max `scoreFormat`) ; notes `null` → cellules `null` ; histogramme « Intervalle / Effectif » avec `[0 ; 1[` … `[19 ; 20]` en fr ; taux en `num(x, '0.0%')`, `null` → `null` ; catégories par libellé ; questions par titre (id si inconnue) ; motifs « Hors programme ×2, sans motif ×1 » ; composition « Facile ×2 · Difficile ×1 » ; ajustements somme au `scoreFormat`.
  - `buildWorkbook` : cinq onglets dans l'ordre, noms en fr et en en ; sur une session d'exemple (`examples/config.example.json`, comme `src/domain/stats/compute-stats.test.ts`), aucune cellule `text` dont la valeur est une note formatée (toutes les colonnes de note sont `number` ou `null`, hors absent `label`).
- [ ] **Step 2: Lancer** → FAIL ; **Step 3: Implémenter** ; **Step 4: Lancer** → PASS ; `rtk pnpm check`.
- [ ] **Step 5: Commit** `✨ Ajoute l'onglet Statistiques et buildWorkbook`.

### Task 4: Écriture xlsx, confinement et contrôle du bundle multi-cibles

**Files:**
- Create: `src/lib/xlsx/write-workbook.ts`, `src/lib/xlsx/write-workbook.test.ts`
- Modify: `package.json` (dépendance `write-excel-file`), `vite.config.ts` (groupe `xlsx`), `.dependency-cruiser.cjs` (règle `xlsx-only-in-lib-xlsx`), `scripts/check-initial-bundle.ts` et son test (cibles multiples), `docs/CONVENTIONS.md` § « Bibliothèque lourde confinée à une route » (généraliser le texte à « à un module chargé en dynamique » si besoin)

**Interfaces:**
- Consumes: `WorkbookSpec`, `Cell` (tâche 1).
- Produces:
  - `toSheetData(sheet: SheetSpec, offsetOf?: (d: Date) => number): unknown[][]` (forme attendue par write-excel-file ; `offsetOf` par défaut `d => d.getTimezoneOffset()`), exportée pour les tests.
  - `writeWorkbook(spec: WorkbookSpec, fileName: string): Promise<void>` — seul appel à `write-excel-file/browser` (`writeXlsxFile(dataArrays, { sheets, columns, stickyRowsCount… }).toFile(fileName)` ou la forme tableau de descripteurs selon la version installée : vérifier les types de `node_modules/write-excel-file`).
  - `check-initial-bundle.ts` : `BUNDLE_TARGETS: { name: string; chunk: RegExp; importer: string }[]` avec Recharts (existant) et `{ name: 'xlsx', chunk: /^_xlsx[.-]/, importer: 'src/lib/xlsx/write-workbook.ts' }` ; `main()` itère : non-vacuité puis fuite, par cible.

- [ ] **Step 1: Installer** `write-excel-file` (dernière version) ; lire ses types pour la forme exacte de l'API navigateur multi-onglets et des cellules (`type: String | Number | Date`, `format`, `fontWeight`).
- [ ] **Step 2: Tests `write-workbook.test.ts`** (sans appeler la bibliothèque) : `text` → `{ value, type: String }` (+ `fontWeight: 'bold'` si gras) ; « =1+1 » → `type: String` ; `number` → `{ value, type: Number, format }` ; `null` → `null` ; `date` à `2026-09-30T08:00:00Z` avec `offsetOf = () => -120` → valeur dont les composantes UTC valent 10:00 ; heure d'hiver/été : deux dates, deux offsets différents, chacun appliqué à sa date (Review Focus 1).
- [ ] **Step 3: Tests `check-initial-bundle.test.ts`** : manifeste à deux cibles propre → aucun problème ; chunk `_xlsx-*` absent → problème de vacuité nommant `xlsx` ; `_xlsx-*` atteint statiquement depuis `index.html` → fuite ; les tests Recharts existants restent verts.
- [ ] **Step 4: Lancer** → FAIL ; **implémenter** ; **lancer** → PASS.
- [ ] **Step 5: Groupe `xlsx`** dans `vite.config.ts` (`write-excel-file`, `fflate`) et règle depcruise `xlsx-only-in-lib-xlsx`. La cible `xlsx` est déclarée dans `BUNDLE_TARGETS` mais **pas encore activée** dans `main()` (rien n'importe `lib/xlsx` avant la tâche 5, la garde de non-vacuité échouerait) : exporter une liste `ACTIVE_TARGETS = [recharts]`, la tâche 5 y ajoute `xlsx`.
- [ ] **Step 6: Vérifier** `rtk pnpm check`, `rtk pnpm build && pnpm check:bundle` vert. Preuve manuelle, non commitée : un `import()` provisoire de `@/lib/xlsx/write-workbook` depuis `src/main.tsx` + cible `xlsx` activée → vert et chunk `_xlsx-*` visible dans le manifeste ; un import **statique** → fuite détectée. Retirer ces modifications.
- [ ] **Step 7: Commit** `➕ Ajoute l'écriture xlsx et étend le contrôle du bundle initial`.

### Task 5: Bouton d'export, orchestration et parcours e2e

**Files:**
- Create: `src/features/session/export-workbook.ts`, `src/features/session/components/export-button.tsx`, `src/features/session/export-button.test.tsx`
- Modify: `scripts/check-initial-bundle.ts` (activer la cible `xlsx`), `src/features/session/components/examiner-view.tsx` (bouton dans l'`actionsSlot`, à côté de « Statistiques »), `src/lib/i18n/ui-messages.ts` (clés `export_*`, fr et en), `e2e/pages/examiner-page.ts` (`exportWorkbook(): Promise<Download>`), `e2e/export.spec.ts`

**Interfaces:**
- Consumes: `computeStats`, `buildWorkbook`, `workbookFileName` ; `writeWorkbook` en `await import('@/lib/xlsx/write-workbook')`.
- Produces: `exportWorkbook(session: Session, locale: Locale): Promise<void>` ; `ExportButton({ ui, session })`.

- [ ] **Step 1: Tests `export-button.test.tsx`** (`vi.mock('@/features/session/export-workbook')`) : libellé « Exporter en Excel » ; clic → `exportWorkbook` appelé avec la session et `'fr'` ; pendant la promesse : bouton désactivé, « Export en cours… » ; rejet → `role="alert"` « L'export a échoué. Réessayez. », bouton réactivé ; en anglais « Export to Excel » / « Exporting… » / « Export failed. Try again. ».
- [ ] **Step 2: Lancer** → FAIL ; **implémenter** (`IconFileSpreadsheet`, `Button` shadcn) ; **lancer** → PASS.
- [ ] **Step 3: e2e `e2e/export.spec.ts`** : fixture `examiner`, noter trois questions du premier étudiant (confirmer le dialogue d'ajustement comme `e2e/stats.spec.ts`), cliquer « Exporter en Excel » dans l'onglet « Étudiants », `page.waitForEvent('download')` ; `suggestedFilename()` = `session-e2e-<AAAA-MM-JJ>.xlsx` ; les deux premiers octets du fichier valent `PK`.
- [ ] **Step 4: Activer la cible `xlsx`** dans `ACTIVE_TARGETS` de `scripts/check-initial-bundle.ts`, puis **vérifier** `rtk pnpm check`, `rtk pnpm build`, `pnpm check:bundle` (les deux cibles vertes, `_xlsx-*` atteint seulement en dynamique), `pnpm e2e`.
- [ ] **Step 5: Commit** `✨ Ajoute le bouton d'export Excel`.
