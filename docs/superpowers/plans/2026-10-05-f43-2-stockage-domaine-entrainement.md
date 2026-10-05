# F43.2 — Stockage, tirage en cycle et stats de l'entraînement — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Poser le stockage Dexie des entraînements et toutes leurs règles métier (tirage en cycle, stats, mise à jour de config, validation à la lecture), testés, sans aucun écran.

**Architecture:** Règles pures dans `src/domain/training/` (aucun Dexie, aucun React). `src/lib/db/` monte Dexie en version 2 (tables `trainings` et `trainingDraws`) et orchestre chaque écriture dans une transaction `rw` qui relit les données fraîches puis appelle les fonctions du domaine. Hooks de lecture `useLiveQuery`, sur le modèle des sessions (F31, D81).

**Tech Stack:** TypeScript, Dexie 4 + `dexie-react-hooks`, Zod 4, Vitest + `fake-indexeddb`.

**Spec:** `docs/superpowers/specs/2026-10-05-f43-entrainement-autonome-design.md` (§ « Modèle de données », « Règles métier »). Ticket : #135. Branche : `feat/135-stockage-entrainement` (créée depuis `main` à jour, après le merge de #134).

## Global Constraints

- Arborescence D59 : `domain/` pur (ni React, ni Dexie, ni `lib/db/`) ; seul `lib/db/` importe le singleton `db` (règle `db-singleton`) ; imports `@/`, pas de `../`, pas de barrel, kebab-case, tests colocalisés. `pnpm deps` passe sans toucher aux règles.
- Messages d'erreur : `Dictionary` / `t` de `@/lib/i18n/i18n`, fr et en, patron de `src/domain/passage/errors.ts` + `messages.ts`.
- **Notes en décimaux (D43)** : `points` et `max` sont stockés en valeurs du barème (ex. `1.5`), convertis en millièmes (`toMilli`, `@/domain/scoring/milli`) seulement dans les calculs. *Écart assumé avec la spec, qui disait « millièmes entiers » ; la tâche 7 corrige la spec et le note dans D101.*
- Ids : `crypto.randomUUID()` injecté (`newId`), comme les sessions ; dates ISO 8601 injectées (`now`).
- Seuil « à revoir » : dernière note **strictement inférieure** à la moitié du max (`points * 2 < max`, en millièmes).
- Commits gitmoji, message au présent en français, emoji Unicode, terminés par :
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` puis `Claude-Session: https://claude.ai/code/session_01Xy2DSgKQywYQtqqvZuaMFw`.
- Préfixer les commandes par `rtk` ; si `rtk vitest run` avale la sortie, `rtk proxy pnpm exec vitest run <chemin>`.
- Tests de `lib/db/` : `import 'fake-indexeddb/auto'` en première ligne ; `createDb(nomUnique)` pour le cycle de vie ; `beforeEach` qui vide les tables pour les tests du singleton (CONVENTIONS § « Mutation de session »).

## Review Focus

1. **Deux onglets qui tirent en même temps** : un seul `pending` doit exister ; le second appel lève `TrainingError('pending_exists')` (tâche 5, test de concurrence).
2. **Journal qui référence une question disparue** (après mise à jour de config) : ignoré par le tirage et les stats, sans lever (tâches 2 et 3).
3. **Barème changé par une mise à jour de config** : les `max` déjà enregistrés restent ceux de l'époque ; les taux restent entre 0 et 1 (tâche 3, test « barème modifié »).
4. **Ligne de journal corrompue** (outcome inconnu, champ manquant) : écartée à la lecture sans casser l'entraînement (tâche 4 + tâche 6).
5. **Migration** : une base v1 avec des sessions ouverte en v2 garde toutes ses sessions ; un onglet resté en v1 passe en `outdated` (tâche 5).

---

### Task 1: Types, erreurs et tirage en cycle

**Files:**
- Create: `src/domain/training/types.ts`, `src/domain/training/errors.ts`, `src/domain/training/errors-messages.ts`, `src/domain/training/cycle-draw.ts`
- Test: `src/domain/training/cycle-draw.test.ts`, `src/domain/training/errors-messages.test.ts`
- Create: `src/testing/training-fixtures.ts` (`makeTraining(overrides?)`, `makeDraw(overrides?)` ; config normalisée à 2 catégories : `a` barème `[0, 1, 2]` questions `a-1`, `a-2`, `a-3` tags `['x']`, `['x','y']`, `[]` ; `b` barème `[0, 0.5, 1]` question `b-1` tag `['y']`)

**Interfaces:**
- Produces (`types.ts`) :
  ```ts
  export type DrawOutcome =
    | { kind: 'pending' }
    | { kind: 'scored'; points: number; max: number } // valeurs du barème (D43)
    | { kind: 'passed' }
  export type TrainingDraw = { id?: number; trainingId: string; questionId: string; drawnAt: string; outcome: DrawOutcome }
  export type Training = { id: string; name: string; createdAt: string; updatedAt: string; config: NormalizedConfig }
  ```
- Produces (`errors.ts`) : `export type TrainingErrorCode = 'category_not_found' | 'pending_exists' | 'not_pending' | 'score_not_in_scale'` ; `export class TrainingError extends Error { readonly code: TrainingErrorCode }` (patron `PassageError`).
- Produces (`errors-messages.ts`) : `export function trainingErrorMessage(error: TrainingError, locale: Locale): string`.
- Produces (`cycle-draw.ts`) :
  - `export function currentPending(draws: readonly TrainingDraw[]): TrainingDraw | undefined`
  - `export function cycleCandidates(config: NormalizedConfig, draws: readonly TrainingDraw[], categoryId: string): NormalizedQuestion[]`
  - `export function pickTrainingQuestion(config: NormalizedConfig, draws: readonly TrainingDraw[], categoryId: string, random: (n: number) => number): string` (renvoie l'id ; utilise `pickUniform` de `@/domain/passage/random`)

- [ ] **Step 1: Tests qui échouent** (`cycle-draw.test.ts`)
  - `journal vide : toutes les questions de la catégorie sont candidates` → `['a-1','a-2','a-3']`.
  - `une question vue sort des candidates jusqu'à la fin du tour` : draws `a-1 scored` → `['a-2','a-3']`.
  - `passed compte comme vue` : `a-2 passed` → `a-2` absente.
  - `pending ne compte pas` : `a-1 pending` → les 3.
  - `catégorie épuisée : remélange` : `a-1, a-2, a-3` tous `scored` une fois → les 3 ; puis `a-1` vu deux fois → `['a-2','a-3']`.
  - `question ajoutée prioritaire` : `a-1, a-2` vus, `a-3` jamais → `['a-3']`.
  - `journal d'une question absente de la config ignoré` : draws `zz-old scored` → les 3.
  - `pickTrainingQuestion tire parmi les candidates` (random stub `() => 1` sur `['a-2','a-3']` → `'a-3'`).
  - `pending_exists si un tirage est en cours` et `category_not_found si la catégorie n'existe pas` : `pickTrainingQuestion` lève `TrainingError` avec ce `code`.
  - `errors-messages.test.ts` : chaque code a un message non vide en fr et en en.
- [ ] **Step 2:** `rtk vitest run src/domain/training/` → FAIL (modules absents).
- [ ] **Step 3: Implémenter.** Compte par question : tirages `scored` ou `passed` dont le `questionId` appartient à la catégorie ; candidates = questions au compte minimal, dans l'ordre de la config.
- [ ] **Step 4:** `rtk vitest run src/domain/training/ && rtk pnpm deps` → PASS.
- [ ] **Step 5: Commit** `✨ Ajoute le tirage en cycle des entraînements`

---

### Task 2: Notation et passage d'un tirage

**Files:**
- Create: `src/domain/training/resolve-draw.ts`
- Test: `src/domain/training/resolve-draw.test.ts`

**Interfaces:**
- Consumes: types et `TrainingError` (tâche 1).
- Produces :
  - `export function scoredOutcome(config: NormalizedConfig, draw: TrainingDraw, points: number): DrawOutcome` → `{ kind: 'scored', points, max: Math.max(...scale) }` ; lève `not_pending` si `draw.outcome.kind !== 'pending'`, `score_not_in_scale` si `points` n'est pas une valeur du barème de la catégorie de la question, `category_not_found` si la question n'est plus dans la config.
  - `export function passedOutcome(draw: TrainingDraw): DrawOutcome` → `{ kind: 'passed' }` ; lève `not_pending` sinon.
  - `export function categoryOfQuestion(config: NormalizedConfig, questionId: string): NormalizedCategory | undefined`

- [ ] **Step 1: Tests** : note valide (`a-2`, `1` → `{ scored, 1, 2 }`) ; note `0.5` refusée sur `a` (`score_not_in_scale`) ; note acceptée sur `b` (`0.5` → max `1`) ; tirage déjà noté → `not_pending` ; passer un `pending` → `passed` ; passer un `passed` → `not_pending` ; question absente de la config → `category_not_found`.
- [ ] **Step 2:** FAIL. **Step 3:** implémenter. **Step 4:** PASS.
- [ ] **Step 5: Commit** `✨ Ajoute la notation et le passage d'un tirage d'entraînement`

---

### Task 3: Stats d'entraînement

**Files:**
- Create: `src/domain/training/training-stats.ts`
- Test: `src/domain/training/training-stats.test.ts`

**Interfaces:**
- Consumes: types (tâche 1), `categoryOfQuestion` (tâche 2), `toMilli` (`@/domain/scoring/milli`).
- Produces :
  ```ts
  export const REVIEW_THRESHOLD = 0.5
  export type Rate = { points: number; max: number; rate: number | null } // points/max en millièmes ; rate 0–1, null sans note
  export type QuestionStats = { questionId: string; categoryId: string; title: string; scoredCount: number; last: { points: number; max: number } | null; meanRate: number | null; toReview: boolean }
  export type TrainingStats = {
    scoredCount: number; passedCount: number
    byCategory: { categoryId: string; label: string; rate: Rate; covered: number; total: number }[]
    byTag: { tag: string; rate: Rate }[] // vide si la config n'a aucun tag
    questions: QuestionStats[] // « à revoir » d'abord, puis ordre de la config
    coverage: { covered: number; total: number }
  }
  export function computeTrainingStats(config: NormalizedConfig, draws: readonly TrainingDraw[]): TrainingStats
  ```
  `last` et les `Rate` en millièmes ; `meanRate` = moyenne des `points/max` de chaque passage noté ; `toReview` = `last !== null && last.points * 2 < last.max`.

- [ ] **Step 1: Tests**
  - `journal vide` : tout à 0, `rate: null`, `coverage { 0, 4 }`, `toReview` faux partout.
  - `taux par catégorie en millièmes` : `a-1` 2/2, `a-2` 1/2 → `byCategory[a].rate = { points: 3000, max: 4000, rate: 0.75 }`.
  - `une question à plusieurs tags compte dans chacun` : `a-2` (`x`,`y`) noté 1/2 → apparaît dans `x` et `y`.
  - `config sans tag : byTag vide`.
  - `passed compté à part, hors taux`.
  - `seuil à revoir aux bornes` : sur `a`, dernière note 1/2 (pile la moitié) → pas à revoir, 0/2 → à revoir ; sur `b`, 0.5/1 → pas à revoir, 0/1 → à revoir.
  - `dernière note = la plus récente par drawnAt`.
  - `à revoir en tête de questions`.
  - `couverture globale et par catégorie` : questions avec ≥ 1 note.
  - `journal d'une question supprimée ignoré`.
  - `barème modifié : max figé` : draw `scored` `{ points: 2, max: 2 }` alors que la config courante a `[0, 1]` → `rate` = 1, pas 2.
- [ ] **Step 2:** FAIL. **Step 3:** implémenter. **Step 4:** PASS.
- [ ] **Step 5: Commit** `✨ Calcule les stats d'un entraînement`

---

### Task 4: Création, mise à jour de config et validation à la lecture

**Files:**
- Create: `src/domain/training/new-training.ts`, `src/domain/training/replace-config.ts`, `src/domain/training/schema.ts`, `src/domain/training/stored-training.ts`
- Test: `new-training.test.ts`, `replace-config.test.ts`, `stored-training.test.ts` (même dossier)

**Interfaces:**
- Produces :
  - `export function newTraining(config: NormalizedConfig, deps: { newId: () => string; now: () => Date }): Training` (`name = config.exam.title`, `createdAt = updatedAt`).
  - `export function replaceTrainingConfig(training: Training, config: NormalizedConfig, draws: readonly TrainingDraw[]): { training: Training; orphanPendingIds: number[] }` — nouvelle config, `name` suivi ; `orphanPendingIds` = ids des tirages `pending` dont la question n'est plus dans la nouvelle config. `updatedAt` n'est pas touché ici (c'est `lib/db` qui le pose).
  - `schema.ts` : `TrainingSchema` (`z.strictObject`, `config: z.unknown()` comme `SessionSchema`) et `TrainingDrawSchema` (`outcome` en union discriminée sur `kind`, `points`/`max` nombres finis).
  - `stored-training.ts` : `export type StoredTrainingResult = { ok: true; training: Training } | { ok: false; issues: ConfigIssue[] }` ; `export function checkStoredTraining(raw: unknown, deps: { cssSupports: CssSupports }): StoredTrainingResult` (schéma → `validateConfig(JSON.stringify(config))`, erreurs seules, chemins préfixés `['training']` / `['training','config']`, patron de `checkStoredSession`) ; `export function parseStoredDraws(raw: readonly unknown[]): TrainingDraw[]` (lignes invalides écartées, ne lève jamais).

- [ ] **Step 1: Tests** : `newTraining` (nom, dates, id) ; `replaceTrainingConfig` (nom suivi, `pending` orphelin listé, `pending` encore valable non listé, journal non modifié) ; `checkStoredTraining` (entraînement sain → `ok` avec config validée ; clé inconnue → `ok: false` chemin `training` ; config invalide → `ok: false` chemin `training.config`) ; `parseStoredDraws` (une ligne `outcome: { kind: 'bogus' }` et une sans `questionId` écartées, les autres gardées dans l'ordre).
- [ ] **Step 2:** FAIL. **Step 3:** implémenter. **Step 4:** PASS (+ `rtk pnpm deps`).
- [ ] **Step 5: Commit** `✨ Ajoute la création, la mise à jour de config et la validation des entraînements`

---

### Task 5: Dexie version 2 et écritures

**Files:**
- Modify: `src/lib/db/db.ts` (version 2, `declare readonly trainings: EntityTable<Training, 'id'>`, `declare readonly trainingDraws: EntityTable<TrainingDraw, 'id'>`)
- Modify: `src/lib/db/errors.ts` (`TrainingNotFoundError`, `TrainingDamagedError`, mêmes formes que leurs pendants session)
- Create: `src/lib/db/damaged-training.ts` (`DamagedTraining = { id; damaged: true; raw; issues: ConfigIssue[] }`, `StoredTraining`, `isDamagedTraining`, `loadReadStoredTraining()` paresseux et mémoïsé comme `loadReadStored`, `damagedTrainingName`)
- Create: `src/lib/db/trainings.ts`
- Test: `src/lib/db/db.test.ts` (ajouts), `src/lib/db/trainings.test.ts`, `src/lib/db/damaged-training.test.ts`

**Interfaces:**
- Consumes: tâches 1, 2, 4.
- Produces (`trainings.ts`) :
  - `createTraining(training: Training): Promise<void>`
  - `getTraining(id: string): Promise<StoredTraining | null>` ; `listTrainings(): Promise<StoredTraining[]>` (`updatedAt` décroissant)
  - `getTrainingDraws(trainingId: string): Promise<TrainingDraw[]>` (ordre d'insertion, via `parseStoredDraws`)
  - `drawTrainingQuestion(trainingId: string, categoryId: string, deps: { random: (n: number) => number; now: () => Date }): Promise<TrainingDraw>`
  - `scoreTrainingDraw(trainingId: string, drawId: number, points: number, deps: { now: () => Date }): Promise<void>`
  - `passTrainingDraw(trainingId: string, drawId: number, deps: { now: () => Date }): Promise<void>`
  - `replaceTrainingConfigInDb(trainingId: string, config: NormalizedConfig, deps: { now: () => Date }): Promise<void>`
  - `deleteTraining(id: string): Promise<void>`
  Chaque écriture : `loadReadStoredTraining()` **avant** la transaction (comme `updateSession`), puis `db.transaction('rw', db.trainings, db.trainingDraws, …)` : relire l'entraînement (absent → `TrainingNotFoundError`, endommagé → `TrainingDamagedError`) et ses tirages frais, appeler le domaine, écrire, poser `updatedAt = now()`.

- [ ] **Step 1: Tests qui échouent**
  - `db.test.ts` : `migration v1 → v2 conserve les sessions` (ouvrir un `Dexie` nommé avec seulement `version(1).stores({ sessions: 'id, updatedAt' })`, y mettre `makeSession()`, fermer, puis `createDb(même nom)` : la session est relue et `verno === 2`) ; le test `outdated` existant passe à une montée en version 3.
  - `trainings.test.ts` : création puis lecture ; `listTrainings` trié ; tirage → `pending` en base ; noter puis relire (`scored`, `max` figé) ; passer ; **deux `drawTrainingQuestion` concurrents** (`Promise.allSettled`) → un seul `pending`, l'autre rejeté `TrainingError` `pending_exists` ; mise à jour de config : `pending` orphelin passé à `passed`, `name` suivi, journal conservé ; `deleteTraining` supprime le journal de cet entraînement seulement ; entraînement endommagé → `TrainingDamagedError` à l'écriture ; absent → `TrainingNotFoundError`.
  - `damaged-training.test.ts` : `damagedTrainingName` (nom du brut, sinon id).
- [ ] **Step 2:** `rtk vitest run src/lib/db/` → FAIL.
- [ ] **Step 3: Implémenter.**
- [ ] **Step 4:** `rtk vitest run src/lib/db/ && rtk pnpm deps` → PASS.
- [ ] **Step 5: Commit** `🗃️ Ajoute les tables d'entraînement à IndexedDB (version 2)`

---

### Task 6: Hooks de lecture

**Files:**
- Modify: `src/lib/db/hooks.ts`
- Test: `src/lib/db/hooks.test.ts` (ajouts)

**Interfaces:**
- Produces : `useTrainings(): StoredTraining[] | undefined` ; `useTraining(id: string): StoredTraining | null | undefined` (masque le résultat d'un autre id, comme `useSession`) ; `useTrainingDraws(trainingId: string): TrainingDraw[] | undefined`.

- [ ] **Step 1: Tests** : `undefined` pendant le chargement puis la valeur ; `null` pour un id absent ; mise à jour après un `drawTrainingQuestion` (réactivité `useLiveQuery`) ; changement d'id → pas de résultat de l'ancien id.
- [ ] **Step 2:** FAIL. **Step 3:** implémenter. **Step 4:** PASS.
- [ ] **Step 5: Commit** `✨ Ajoute les hooks de lecture des entraînements`

---

### Task 7: Mémoire et documentation

**Files:**
- Modify: `docs/superpowers/specs/2026-10-05-f43-entrainement-autonome-design.md` (§ « Modèle de données » : `points`/`max` en valeurs du barème, D43 ; noms réels des fonctions de `lib/db/trainings.ts` ; fichiers `resolve-draw.ts`, `new-training.ts`, `schema.ts`, `errors.ts`)
- Modify: `docs/DECISIONS.md` (D101 : ligne « Notes en décimaux (D43) » + ligne « Journal : lignes invalides écartées à la lecture »)
- Modify: `docs/CONVENTIONS.md` (nouvelle section « Mutation d'entraînement — squelette » après « Mutation de session », avec un exemple `drawTrainingQuestion` et les règles tacites : domaine pur appelé dans la transaction, `loadReadStoredTraining` avant la transaction)
- Modify: `docs/QUIRKS.md` (entrée : les checks `codecov/patch` et `codecov/project` peuvent rester « in_progress » alors que le rapport et le commentaire sont postés — constaté sur la PR #138 ; relancer le job `check` les débloque)
- Modify: `docs/INDEX.md` (ligne F43.2, « En revue »), `docs/HANDOFF.md` (entrée datée, 4 marqueurs)

- [ ] **Step 1: Rédiger.** Lire chaque `docs/*.md` par plage (`grep -n '^## '` puis `offset`/`limit`).
- [ ] **Step 2:** `rtk pnpm check` → vert.
- [ ] **Step 3: Commit** `📝 Documente le stockage des entraînements (F43.2)`

---

## Après les tâches (session principale)

PR brouillon `Closes #135`, `sonar-check.sh --pr <n> --wait`, « Ready for review » une fois le gate OK. Pas de merge sans le go de l'utilisateur.
