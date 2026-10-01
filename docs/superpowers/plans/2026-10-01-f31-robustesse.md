# F31 — Robustesse des données persistées — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Une session endommagée en IndexedDB affiche un écran « endommagée » exportable au lieu de planter ; `final_scale_off_grid` devient une erreur ; l'indicateur de persistance est relu au retour sur l'onglet.

**Architecture:** La validation de l'import de backup est extraite dans `checkStoredSession` (domaine) et appliquée à chaque lecture par `lib/db`, qui renvoie une `Session` validée ou un `DamagedSession`. Les pages aiguillent vers un écran partagé ; l'accueil vers une carte réduite. `updateSession` refuse d'écrire sur une session endommagée.

**Tech Stack:** React 19, TypeScript, Dexie + dexie-react-hooks, zod, Vitest + Testing Library + fake-indexeddb, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-01-f31-robustesse-design.md`

## Global Constraints

- Arborescence D59 : `lib/` technique, `domain/` pur (ni React ni Dexie), `features/<x>/` sans import croisé, imports `@/`, pas de barrel, fichiers kebab-case. `lib/db/` peut importer `domain/` (règle depcruise `lib-no-domain`). `pnpm deps` doit rester vert : corriger l'emplacement, jamais la règle.
- Lire `docs/CONVENTIONS.md` par section (`grep -n '^## ' docs/CONVENTIONS.md`, puis `Read` avec `offset`/`limit`) avant d'écrire un type de code ; ne jamais lire un `docs/*.md` en entier.
- Commits gitmoji, message au présent en français, emoji Unicode, terminés par :
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` et `Claude-Session: https://claude.ai/code/session_012kDDaQK1YAB2LipMmZBt3p`.
- Tests unitaires : `rtk proxy pnpm exec vitest run <chemin>` (le filtre `rtk vitest` échoue sur ce dépôt). Vérification complète : `rtk proxy pnpm check`.
- Textes d'interface fr et en, dans `src/lib/i18n/ui-messages.ts` (type `UiMessageParams`, dictionnaires `fr` et `en`, liste des clés dans `ui-messages.test.ts`). Apostrophe typographique `’` comme le reste du fichier.
- Bornes de l'ajustement : fini, au plus 3 décimales, `|value| ≤ 10 000` (D44).
- Ne jamais réécrire une session endommagée ; l'export écrit `raw` tel quel.

## Review Focus

- Un enregistrement qui n'est même pas un objet (`null` dans un champ requis, `students` absent) : `listSessions` ne doit pas lever et la carte doit afficher l'`id`. → Tâche 4 (test `listSessions` sur `{ id: 'x' }`), Tâche 6 (carte sur `raw = { id: 'x' }`).
- Un `name` non chaîne dans le brut (`name: 42`) : nom de fichier et carte se rabattent sur l'`id`. → Tâche 5 (test `backupFileName`), Tâche 6.
- Une session valide qui devient endommagée pendant qu'elle est ouverte (autre onglet) : la page bascule sans exception et toute écriture en cours est refusée. → Tâche 4 (test `updateSession`), Tâche 5 (test de la page qui rerend après corruption).
- La vue projetée ne laisse fuir ni issue ni bouton. → Tâche 5 (test `present` : aucun `button`, aucun texte d'issue).
- Les fixtures de test existantes restent valides : sans quoi la moitié des tests de composants verraient des sessions endommagées. → Tâche 3.

---

### Task 1: `final_scale_off_grid` devient une erreur

**Files:**
- Modify: `src/domain/config/rules.ts` (`checkFinalScaleGrid`, ~l.171-180), `src/domain/config/messages.ts` (l.79-80 et 134-135), `PRODUCT.md` §6.2 (ligne « Avertissement si `finalScale` n'est pas un multiple du pas »)
- Test: `src/domain/config/rules.test.ts` (l.283-306)

**Interfaces:**
- Produces: issue `final_scale_off_grid` de sévérité `'error'`, mêmes `path` et `params`.

- [ ] **Step 1:** Adapter les tests existants : `final_scale_off_grid avec un pas explicite` attend `severity: 'error'` ; ajouter `validateConfig` sur une config à `finalScale: 20.25`, pas `0.5` → `ok: false` avec cette issue.
- [ ] **Step 2:** Lancer `src/domain/config/` : FAIL.
- [ ] **Step 3:** `configError` à la place de `configWarning` dans `checkFinalScaleGrid`. Messages :
  - fr : `` `L’échelle finale (${finalScale}) doit être un multiple du pas d’arrondi (${step}).` ``
  - en : `` `The final scale (${finalScale}) must be a multiple of the rounding step (${step}).` ``
  - PRODUCT.md : « **Erreur** si `finalScale` n'est pas un multiple du pas d'arrondi (la note maximale serait hors grille, §5). », déplacée avec les autres erreurs.
- [ ] **Step 4:** `rtk proxy pnpm exec vitest run src/domain src/features/create-session src/features/config-editor` : PASS. Vérifier que `examples/*.json` et `e2e/fixtures/*.json` restent valides (les tests qui les chargent passent).
- [ ] **Step 5:** Commit `🚸 Refuse une échelle finale hors de la grille du pas`.

### Task 2: `invalid_adjustment` et `checkStoredSession`

**Files:**
- Create: `src/domain/backup/stored-session.ts`, `src/domain/backup/stored-session.test.ts`
- Modify: `src/domain/backup/parse.ts`, `src/domain/backup/rules.ts`, `src/domain/backup/issues.ts`, `src/domain/backup/messages.ts`
- Test: `src/domain/backup/rules.test.ts`, `src/domain/backup/messages.test.ts`

**Interfaces:**
- Produces:
  - `type StoredSessionResult = { ok: true; session: Session } | { ok: false; issues: BackupIssue[] }`
  - `function checkStoredSession(raw: unknown, deps: { cssSupports: CssSupports }): StoredSessionResult` — `SessionSchema.safeParse(raw)` (issues zod via `fromZodIssues`, chemins préfixés `['session', …]`), puis `validateConfig(JSON.stringify(session.config), deps)` (erreurs seules, chemins préfixés `['session', 'config', …]`), puis `checkSessionRules` ; renvoie `{ ...session, config: validated.config }`.
  - Code `invalid_adjustment: { value: number }`, chemin `['session', 'students', s, 'adjustment', 'value']`.

- [ ] **Step 1:** Tests de règles (`rules.test.ts`) : `invalid_adjustment` pour `1e20`, `-10000.5`, `0.0005`, `Infinity`, `NaN` ; aucune issue pour `-0.5`, `10000`, `-10000`, `1.125`.
- [ ] **Step 2:** Tests `stored-session.test.ts` : `richSession()` → `ok: true` et `session` égale à `richSession()` ; attempt `scored` sans `score` → `score_mismatch` ; `adjustment: { value: 1e20 }` → `invalid_adjustment` ; `activeStudentId: 'inconnu'` → `unknown_active_student` ; config `finalScale: 20.25` au pas `0.5` → `final_scale_off_grid` au chemin `['session', 'config', 'scoring', 'finalScale']` ; `raw = { id: 'x' }` et `raw = null` → `ok: false` sans exception.
- [ ] **Step 3:** Lancer : FAIL.
- [ ] **Step 4:** Implémenter. Dans `parse.ts`, `BackupEnvelopeSchema.session` devient `z.unknown()` et `parseBackup` délègue la session à `checkStoredSession` : les chemins d'issues ne changent pas (les tests existants de `parse.test.ts` passent sans modification). Message `invalid_adjustment` : fr `` `L’ajustement ${value} est invalide : au plus 3 décimales et au plus 10 000 en valeur absolue.` ``, en `` `The adjustment ${value} is invalid: at most 3 decimals and at most 10,000 in absolute value.` `` ; l'ajouter à `BACKUP_CODE_MAP`.
- [ ] **Step 5:** `rtk proxy pnpm exec vitest run src/domain/backup` : PASS.
- [ ] **Step 6:** Commit `♻️ Extrait la validation d’une session stockée et borne l’ajustement`.

### Task 3: Fixtures de test valides

**Files:**
- Modify: `src/testing/student-fixtures.ts` (`makeConfig`)
- Create: `src/testing/fixtures-validity.test.ts`

**Interfaces:**
- Consumes: `checkStoredSession` (Tâche 2), `acceptAllCss` (`src/testing/backup-fixtures.ts`).
- Produces: `makeConfig()` dont la catégorie `a` a les questions `a-1` à `a-10` (prompts `Question A1`…), le reste inchangé.

- [ ] **Step 1:** Test : `checkStoredSession(makeSession(), …)`, `checkStoredSession(richSession(), …)`, `checkStoredSession(makeSession({ students: [makeStudent([2, { skipped: 'x' }, 1, 'pending'])] }), …)` (avec `makeConfig({}, undefined, { enabled: true, maxPerStudent: 1, reasons: [] })` si un skip l'exige — reprendre la forme de `skips` de `ParsedConfig`) sont tous `ok: true`.
- [ ] **Step 2:** Lancer : FAIL (`unknown_question`).
- [ ] **Step 3:** Étendre les questions de la catégorie `a` dans `makeConfig` uniquement (`minimalConfig` reste « la plus petite config valide »).
- [ ] **Step 4:** `rtk proxy pnpm exec vitest run` (suite complète) : PASS. Un test qui dépendait du nombre de questions de `makeConfig` se corrige dans le test, pas dans la fixture.
- [ ] **Step 5:** Commit `✅ Rend valides les sessions de test construites par les fixtures`.

### Task 4: Lecture et écriture validées (`lib/db`)

**Files:**
- Create: `src/lib/db/damaged-session.ts`
- Modify: `src/lib/db/sessions.ts`, `src/lib/db/hooks.ts`, `src/lib/db/errors.ts`, `src/features/session/session-page.tsx`, `src/features/stats/stats-page.tsx`, `src/features/present/hooks/use-projected-view.ts`, `src/features/present/present-page.tsx`, `src/features/home/home-page.tsx`, `src/features/home/components/session-list.tsx`
- Test: `src/lib/db/sessions.test.ts`, `src/lib/db/hooks.test.ts`

**Interfaces:**
- Consumes: `checkStoredSession` (Tâche 2).
- Produces (dans `src/lib/db/damaged-session.ts`) :
  - `type DamagedSession = { id: string; damaged: true; raw: unknown; issues: BackupIssue[] }`
  - `type StoredSession = Session | DamagedSession`
  - `function isDamaged(value: StoredSession): value is DamagedSession`
  - `function readStored(raw: unknown, id: string): StoredSession` — appelle `checkStoredSession` avec `cssSupports` = `CSS.supports` s'il existe, sinon `() => true` (jsdom n'a pas `CSS.supports`).
- Produces (dans `sessions.ts` / `hooks.ts` / `errors.ts`) :
  - `getSession(id): Promise<StoredSession | null>` ; `listSessions(): Promise<StoredSession[]>` ; `useSession(id): StoredSession | null | undefined` ; `useSessions(): StoredSession[] | undefined`.
  - `class SessionDamagedError extends Error { readonly id: string }`, `name = 'SessionDamagedError'`, message `` `Session « ${id} » endommagée : écriture refusée.` ``.
  - `updateSession` : après `db.sessions.get(id)`, `readStored` ; endommagée → lève `SessionDamagedError` avant d'appeler le mutator ; sinon le mutator reçoit la session **validée**. La garde « `next === current` → pas d'écriture » compare au résultat validé.
  - `useProjectedView(id): ProjectedView | 'damaged' | null | undefined`.

- [ ] **Step 1:** Tests `sessions.test.ts` (écrire le brut par `db.sessions.put(raw as never)`) : `getSession` d'une session saine renvoie la session validée (`toEqual(makeSession())`) ; d'un attempt `scored` sans score → `isDamaged` vrai, `raw` égal à l'enregistrement, `issues[0].code === 'score_mismatch'` ; `listSessions` mêle sain et endommagé dans l'ordre `updatedAt` décroissant ; `{ id: 'x' }` (sans `updatedAt`) apparaît en fin de liste et ne lève pas ; `updateSession` sur une session endommagée rejette en `SessionDamagedError`, le mutator (`vi.fn`) n'est pas appelé et l'enregistrement est inchangé.
- [ ] **Step 2:** Test `hooks.test.ts` : `useSession` renvoie la forme endommagée, puis bascule de saine à endommagée quand l'enregistrement est corrompu après le montage.
- [ ] **Step 3:** Lancer : FAIL.
- [ ] **Step 4:** Implémenter. `listSessions` : `orderBy('updatedAt').reverse().toArray()` (le commentaire oxlint existant est conservé), puis les enregistrements absents de l'index (`db.sessions.toArray()`, filtre sur les id déjà vus) ajoutés en fin. Pages : provisoirement, `isDamaged(session)` → `<SessionFallback ui={ui} kind="not-found" />` (passage, stats), `view === 'damaged'` → idem (vue projetée) ; `SessionList` filtre provisoirement les endommagées (`sessions.filter((s) => !isDamaged(s))`) ; la Tâche 5 et la Tâche 6 remplacent ces branches.
- [ ] **Step 5:** `rtk proxy pnpm check` : PASS.
- [ ] **Step 6:** Commit `🥅 Valide les sessions lues et refuse d’écrire sur une session endommagée`.

### Task 5: Écran « session endommagée » et export brut

**Files:**
- Create: `src/components/damaged-session.tsx`, `src/components/damaged-session.test.tsx`, `src/components/export/export-backup.ts`
- Delete: `src/features/home/export-session.ts` (appelants : `session-card.tsx`, `delete-dialog.tsx` → nouveau chemin)
- Modify: `src/domain/backup/serialize.ts`, `src/domain/backup/envelope.ts` (si le type d'enveloppe fixe `session: Session`), `src/lib/i18n/ui-messages.ts` (+ test), les trois pages de la Tâche 4
- Test: `src/domain/backup/serialize.test.ts`, tests des pages (`session-page`, `stats-page`, `present-page` s'ils existent ; sinon dans `damaged-session.test.tsx` via `renderAt` de `src/testing/render-at.tsx`)

**Interfaces:**
- Consumes: `DamagedSession`, `isDamaged` (Tâche 4) ; `formatBackupIssue`, `formatIssuePath` (`domain/backup/messages.ts`).
- Produces:
  - `serializeBackup(session: unknown, now?: Date): string` (même enveloppe) ; `backupFileName(session: unknown, now?: Date): string` — `name` si chaîne non vide après `trim`, sinon `id` si chaîne, sinon `'session'`.
  - `exportBackup(session: unknown): void` dans `src/components/export/export-backup.ts` (corps de l'actuel `exportSession`).
  - `DamagedSessionScreen({ ui, damaged, variant }: Readonly<{ ui: Ui; damaged: DamagedSession; variant: 'examiner' | 'present' }>)`.
  - Clés i18n : `damaged_title` (« Cette session est endommagée » / “This session is damaged”), `damaged_body` (« Le contenu enregistré est incohérent ; l’application ne peut pas l’ouvrir. Exportez un backup pour le conserver ou le corriger. » / “The saved content is inconsistent; the app cannot open it. Export a backup to keep it or fix it.”), `damaged_details` (« Détails » / “Details”).

- [ ] **Step 1:** Tests `serialize.test.ts` : `serializeBackup({ id: 'x', foo: 1 })` contient `"session": { "id": "x", "foo": 1 }` ; `backupFileName({ name: 42, id: 'abc' }, date)` → `abc-backup-<date>.json` ; `{ name: '  ' }` sans id → `session-backup-<date>.json`.
- [ ] **Step 2:** Tests `damaged-session.test.tsx` : variante `examiner` → titre (`heading`), corps, bouton « Exporter un backup » qui appelle `downloadText` (mock de `@/lib/download`) avec `serializeBackup(raw)` à l'identique hormis `exportedAt`, lien « Retour à l’accueil » vers `/`, `<details>` contenant le message et le chemin de chaque issue ; variante `present` → titre seul, `queryAllByRole('button')` vide, aucun texte d'issue.
- [ ] **Step 3:** Tests de pages : `#/session/<id>` et `#/session/<id>/stats` sur une session endommagée en base → titre `damaged_title` sans exception ; `#/present?…` (forme d'URL existante de la vue projetée) → variante `present` ; une session saine corrompue après le montage → la page bascule sur le titre.
- [ ] **Step 4:** Lancer : FAIL.
- [ ] **Step 5:** Implémenter ; remplacer les branches provisoires de la Tâche 4 par `DamagedSessionScreen` (`useUi()` de la page, hors `SessionAppearance`). Mise en page : reprendre le `<main>` centré de `SessionFallback`.
- [ ] **Step 6:** `rtk proxy pnpm check` : PASS.
- [ ] **Step 7:** Commit `🥅 Affiche un écran d’export pour une session endommagée`.

### Task 6: Carte d'accueil d'une session endommagée

**Files:**
- Create: `src/features/home/components/damaged-session-card.tsx`, `src/features/home/components/damaged-session-card.test.tsx`
- Modify: `src/features/home/components/session-list.tsx`, `src/features/home/components/delete-dialog.tsx`, `src/features/home/components/session-card.tsx`, `src/lib/i18n/ui-messages.ts` (+ test)

**Interfaces:**
- Consumes: `DamagedSession`, `isDamaged` (Tâche 4) ; `exportBackup`, `backupFileName` (Tâche 5) ; clés `damaged_body` (Tâche 5).
- Produces:
  - `DeleteDialog` prend `{ ui, sessionId: string, name: string, backup: unknown, open, onOpenChange }` au lieu de `session` ; son bouton d'export appelle `exportBackup(backup)`. `SessionCard` passe `sessionId={session.id} name={session.name} backup={session}`.
  - `DamagedSessionCard({ ui, damaged }: Readonly<{ ui: Ui; damaged: DamagedSession }>)` : titre = `name` lisible du brut (chaîne non vide) sinon `id` ; badge `damaged_badge` (« Endommagée » / “Damaged”) ; `damaged_body` ; menu `card_actions` avec « Exporter un backup » et « Supprimer » seulement.
  - `SessionList` reçoit `StoredSession[] | undefined` et aiguille (retire le filtre provisoire de la Tâche 4).

- [ ] **Step 1:** Tests : carte sur `raw = { id: 'x', name: 'Oral cassé' }` → titre « Oral cassé », badge, aucun lien « Reprendre », aucune barre de progression (`progressbar`), menu à deux entrées exactement ; carte sur `raw = { id: 'x' }` → titre `x` ; « Supprimer » ouvre le dialogue et supprime l'enregistrement (`db.sessions.get('x')` → `undefined`) ; `SessionList` affiche une carte saine et une endommagée.
- [ ] **Step 2:** Lancer : FAIL.
- [ ] **Step 3:** Implémenter (badge : composant existant s'il y en a un dans `src/components/ui/`, sinon un `span` stylé ; ne pas ajouter de composant shadcn pour ça).
- [ ] **Step 4:** `rtk proxy pnpm check` : PASS.
- [ ] **Step 5:** Commit `🥅 Signale une session endommagée sur l’accueil`.

### Task 7: Indicateur de persistance relu au retour sur l'onglet

**Files:**
- Modify: `src/lib/db/persistence.ts`
- Test: `src/lib/db/persistence.test.ts`

**Interfaces:**
- Produces: même API (`usePersistenceStatus`, `requestPersistentStorage`).

- [ ] **Step 1:** Tests (style existant : `stubStorage`, `vi.resetModules`, `load()`) : `persisted` renvoie `false` puis `true` ; après `document` `visibilitychange` avec `visibilityState` `'visible'` (`Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true })`), le hook passe de `best-effort` à `persisted` ; `'hidden'` ne relit pas (`persisted` appelé une fois) ; après démontage du dernier abonné, `visibilitychange` ne relit plus ; un nouvel abonnement relit et réécoute.
- [ ] **Step 2:** Lancer : FAIL.
- [ ] **Step 3:** Implémenter : l'écouteur est ajouté quand `listeners` passe de 0 à 1, retiré quand il repasse à 0 ; au réabonnement, `refresh()` est relancé (remplacer la seule mémorisation `firstRead` par ce cycle). Garder `typeof document === 'undefined'` sûr.
- [ ] **Step 4:** `rtk proxy pnpm exec vitest run src/lib/db/persistence.test.ts` puis `rtk proxy pnpm check` : PASS.
- [ ] **Step 5:** Commit `🐛 Relit la persistance du stockage au retour sur l’onglet`.

### Task 8: e2e et mémoire projet

**Files:**
- Create: `e2e/damaged-session.spec.ts`
- Modify: `e2e/pages/examiner-page.ts` ou `e2e/pages/home-page.ts` (méthodes nécessaires seulement), `docs/DECISIONS.md` (D81), `docs/INDEX.md`, `docs/BACKLOG.md`, `docs/HANDOFF.md`, `docs/QUIRKS.md` (si piège), `docs/CONVENTIONS.md` (si nouveau pattern : lecture validée et `StoredSession`)

**Interfaces:**
- Consumes: fixture `examiner` (`e2e/fixtures.ts`), URL `#/session/<id>`.

- [ ] **Step 1:** Spec e2e : depuis l'écran examinateur d'une session neuve, tirer et noter une question ; corrompre l'enregistrement par `page.evaluate` sur IndexedDB (base et store : lire `src/lib/db/db.ts` ; retirer `score` du premier attempt `scored`) ; `page.reload()` → titre « Cette session est endommagée » ; « Exporter un backup » → `waitForEvent('download')`, le JSON a pour `session` l'enregistrement lu juste avant via `page.evaluate` ; « Retour à l’accueil » → carte badgée « Endommagée ».
- [ ] **Step 2:** `rtk proxy pnpm exec playwright test e2e/damaged-session.spec.ts` : PASS ; puis toute la suite `rtk proxy pnpm e2e` : PASS.
- [ ] **Step 3:** Mémoire : D81 (tableau « Décisions » de la spec, format des entrées D existantes : lire la dernière, D80) ; ligne INDEX en tête de table (F31, spec, plan) ; retirer les items BACKLOG marqués `→ #79` ; entrée HANDOFF avec les quatre marqueurs en gras.
- [ ] **Step 4:** `rtk proxy pnpm check` : PASS.
- [ ] **Step 5:** Commit `✅ Couvre la session endommagée en e2e et met à jour la mémoire`.
