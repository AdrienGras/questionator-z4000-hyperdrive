# F13 — Onglet « Étudiants » Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** L'onglet « Étudiants » du panneau latéral : liste de la session, changement d'étudiant actif, ajout d'étudiant ; le sélecteur provisoire de l'en-tête disparaît.

**Architecture:** Transitions pures et sélecteurs dans `src/domain/` (`addStudent`, `findDuplicate`, `rosterScore`), exposés par `usePassageActions` via `updateSession`. Côté écran, `StudentsTab` (liste de `StudentRow` + `AddStudentDialog`) est passé à `SidePanel` par `ExaminerView`, comme `StudentTab` en F12.

**Tech Stack:** React 19, TypeScript, Dexie (`updateSession`, `useLiveQuery`), shadcn (`Dialog`, `Input`, `Label`, `Button`), `@tabler/icons-react`, Vitest + Testing Library + fake-indexeddb.

**Spec:** `docs/superpowers/specs/2026-09-29-f13-students-tab-design.md` (décision D68 dans `docs/DECISIONS.md`).

## Global Constraints

- Arborescence D59 : `domain/` sans React ni `lib/db`, `features/session/` n'importe aucune autre feature, imports par `@/`, pas de barrel, fichiers en kebab-case. `pnpm deps` doit rester vert.
- Mutation de session (CONVENTIONS, D67) : une transition ne modifie jamais la session reçue ; sans effet, elle renvoie **la même référence**.
- Tout texte visible passe par `ui.text(...)` avec une entrée fr **et** en dans `src/lib/i18n/ui-messages.ts` ; les erreurs de passage par `domain/passage/messages.ts` (fr et en).
- La colonne de note affiche la note brute puis la note **finale** (`computeScores(...).final`, ajustement compris), `score_not_computed` (« — ») si `null`, `config.absent.label` pour un absent (D68).
- Cliquer sur un étudiant ou « Ajouter et faire passer » ne change **ni** `projection` **ni** l'onglet du panneau.
- Commits gitmoji en français, au présent, emoji Unicode, avec les lignes `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` et `Claude-Session: https://claude.ai/code/session_011GaMaWoWjBN7xkjiNij3Jx`.
- Commandes : `pnpm vitest run <fichier>` pour un test, `pnpm check` en fin de tâche (format, lint, deps, types, tests).

## Review Focus

- **Ajouter et faire passer pendant une question `pending`** : l'étudiant quitté garde sa question `pending` et la retrouve au retour (test en Task 4).
- **Double clic sur un bouton du dialogue** : un seul étudiant créé (test en Task 4).
- **Champs faits d'espaces seulement** : boutons désactivés, aucun avertissement de doublon (tests en Tasks 1 et 4).
- **`activeStudentId` orphelin** (backup restauré) : aucune ligne en `aria-current`, pas de plantage (test en Task 3).
- **Entrée dans le dialogue** : soumet comme « Ajouter » (sans activer) ; fermer le dialogue (Échap, bouton) vide ses champs (test en Task 4).

---

### Task 1: Clé de doublon partagée et sélecteurs de liste

**Files:**
- Create: `src/domain/students/identity.ts`, `src/domain/students/identity.test.ts`
- Modify: `src/domain/students/parse-csv.ts` (retire `fold` / `identityKey` locaux, importe `identityKey`)
- Modify: `src/domain/passage/selectors.ts`, `src/domain/passage/selectors.test.ts`

**Interfaces:**
- Produces:
  - `identityKey(lastName: string, firstName: string): string` — sans diacritiques, sans casse, **sans trim** (l'appelant trime), comme l'actuelle fonction privée de `parse-csv.ts`.
  - `findDuplicate(session: Session, names: { lastName: string; firstName: string }): Student | undefined` — trime les deux valeurs ; `undefined` si l'une est vide après trim ; sinon premier étudiant par `order` croissant dont `identityKey(s.lastName.trim(), s.firstName.trim())` égale celle des valeurs.
  - `type RosterScore = { kind: 'absent' } | { kind: 'scored'; raw: Milli; final: Milli | null }` et `rosterScore(student: Student, config: NormalizedConfig): RosterScore` — `absent` si `student.absent`, sinon `raw` et `final` de `computeScores(student, config)`.

- [ ] **Step 1: Tests `identity.test.ts`** — `identityKey('Durand', 'Élodie') === identityKey('DURAND', 'elodie')` ; `identityKey('Durand', 'Alice') !== identityKey('Durand', 'Alicia')` ; séparateur non ambigu : `identityKey('ab', 'c') !== identityKey('a', 'bc')`.
- [ ] **Step 2: Tests `selectors.test.ts`** (fixtures `makeSession` / `makeStudent` / `makeConfig` de `@/testing/`) :
  - `findDuplicate` trouve « Durand Élodie » pour `{ lastName: '  durand ', firstName: 'ELODIE' }` ;
  - renvoie `undefined` pour `{ lastName: '   ', firstName: 'Élodie' }` et pour un nom absent de la session ;
  - avec deux étudiants de même clé (`order` 3 puis 1 dans le tableau), renvoie celui d'`order` 1.
  - `rosterScore` : absent → `{ kind: 'absent' }` ; todo → `raw` 0 et `final: null` ; in_progress → `raw` = somme des notes, `final: null` ; done sans ajustement → `final` = `computeScores(...).final` ; done avec `adjustment: { value: 1 }` (en unités de la config, voir `adjust.test.ts` pour la forme) → `final` inclut l'ajustement et diffère de `converted`.
- [ ] **Step 3: Lancer** `pnpm vitest run src/domain/students/identity.test.ts src/domain/passage/selectors.test.ts` — Expected: FAIL (exports manquants).
- [ ] **Step 4: Implémenter** `identity.ts` (déplacer `fold` + `identityKey` de `parse-csv.ts`, qui l'importe) puis `findDuplicate` et `rosterScore` dans `selectors.ts`.
- [ ] **Step 5: Lancer** les deux fichiers plus `src/domain/students/parse-csv.test.ts` — Expected: PASS, `parse-csv.test.ts` inchangé et vert.
- [ ] **Step 6: Commit** — `♻️ Partage la clé de doublon et ajoute les sélecteurs de la liste d'étudiants`.

### Task 2: Transition `addStudent`, `setActiveStudent` sans écriture inutile, action du hook

**Files:**
- Create: `src/domain/passage/add-student.ts`, `src/domain/passage/add-student.test.ts`
- Modify: `src/domain/passage/active-student.ts`, `src/domain/passage/active-student.test.ts`
- Modify: `src/domain/passage/errors.ts` (code `student_name_required`), `src/domain/passage/messages.ts`
- Modify: `src/features/session/hooks/use-passage-actions.ts`

**Interfaces:**
- Produces:
  - `addStudent(session: Session, input: { lastName: string; firstName: string; activate: boolean }, deps: { newId: () => string }): Session`
  - `PassageErrorCode` gagne `'student_name_required'` ; messages fr « Le nom et le prénom sont obligatoires. », en « Last name and first name are required. »
  - `PassageActions.addStudent: (names: { lastName: string; firstName: string }, options: { activate: boolean }) => Promise<boolean>` — passe par `run`, `newId: () => crypto.randomUUID()` dans le mutator.

- [ ] **Step 1: Tests `add-student.test.ts`** :
  - session à deux étudiants d'`order` 0 et 5 : le nouveau a `order` 6, est **dernier** du tableau, `id` = valeur de `newId`, `addedDuringSession: true`, `absent: false`, `attempts: []`, et n'a aucune clé `comment`, `adjustment`, `finalRevealedAt` (`not.toHaveProperty`) ;
  - session sans étudiant : `order` 0 ;
  - `{ lastName: '  Durand ', firstName: ' Alice  ' }` → stocké `'Durand'` / `'Alice'` ;
  - `lastName: '   '` ou `firstName: ''` → lève `PassageError` de code `student_name_required` ;
  - `activate: false` → `activeStudentId` inchangé ; `activate: true` → `activeStudentId` = nouvel id ;
  - `projection` égale (`toEqual`) à celle d'entrée dans les deux cas ;
  - entrée non modifiée (`structuredClone` avant, `toEqual` après).
- [ ] **Step 2: Tests `active-student.test.ts`** (ajouts) : `setActiveStudent` laisse `projection` intacte (`{ mode: 'student', studentId: autre }`) ; si l'étudiant visé est déjà actif, `toBe(session)`.
- [ ] **Step 3: Test `messages.test.ts`** : il vérifie déjà que chaque code a un message fr et en — ajouter le code au type suffit à le faire échouer tant que les messages manquent (vérifier en lançant).
- [ ] **Step 4: Lancer** `pnpm vitest run src/domain/passage` — Expected: FAIL.
- [ ] **Step 5: Implémenter** `add-student.ts`, le cas « déjà actif » de `setActiveStudent`, le code d'erreur et ses messages, puis l'action `addStudent` du hook (même forme que `setAbsent` : `run((session) => addStudent(session, { ...names, ...options }, { newId: () => crypto.randomUUID() }))`).
- [ ] **Step 6: Lancer** `pnpm vitest run src/domain/passage src/features/session` — Expected: PASS.
- [ ] **Step 7: Commit** — `✨ Ajoute la transition d'ajout d'étudiant en cours de session`.

### Task 3: Onglet « Étudiants » (liste, changement d'étudiant) et retrait du sélecteur provisoire

**Files:**
- Create: `src/features/session/student-status-label.ts` (exporte `STATUS_KEY`, déplacé de `student-picker.tsx`)
- Create: `src/features/session/components/student-row.tsx`, `src/features/session/components/students-tab.tsx`
- Create: `src/features/session/students-tab.test.tsx`
- Modify: `src/features/session/components/side-panel.tsx` (prop `studentsTab: ReactNode` à la place de `side_panel_students_soon`)
- Modify: `src/features/session/components/examiner-view.tsx`, `src/features/session/components/passage-header.tsx` (prop `picker` retirée)
- Delete: `src/features/session/components/student-picker.tsx`
- Modify: `src/lib/i18n/ui-messages.ts` (+ son test s'il liste les clés)
- Modify: `src/features/session/examiner-view.test.tsx`, `src/features/session/student-tab.test.tsx`, `src/features/session/side-panel.test.tsx`, `src/features/session/passage-example.test.tsx` (tout ce qui passait par le `combobox` « Étudiant » ou `side_panel_students_soon`)

**Interfaces:**
- Consumes: `rosterScore`, `RosterScore` (Task 1) ; `selectStudent` du hook (existant).
- Produces:
  - `StudentsTab` props : `{ ui: Ui; session: Session; activeStudentId: string | undefined; disabled: boolean; onSelect: (studentId: string) => void; actionsSlot?: ReactNode }`. La Task 4 ajoute `onAdd`.
  - `StudentRow` props : `{ ui: Ui; config: NormalizedConfig; student: Student; active: boolean; projected: boolean; disabled: boolean; onSelect: (studentId: string) => void }`.
  - Clés i18n ajoutées (fr / en) : `students_list_label` « Étudiants de la session » / « Session students » ; `students_projected` « Projeté » / « Projected » ; `students_row_scores` `({ raw, final })` → `` `${raw} · ${final}` `` (mêmes deux langues). Retirées : `passage_student_picker`, `passage_student_option`, `side_panel_students_soon`.

- [ ] **Step 1: Tests `students-tab.test.tsx`** (montage par `renderAt` + `putSession` comme `side-panel.test.tsx`, panneau ouvert, onglet « Étudiants » cliqué) :
  - les boutons de la liste (`within(getByRole('list', { name: 'Étudiants de la session' })).getAllByRole('button')`) suivent `order`, pas l'ordre du tableau ;
  - le bouton de l'étudiant actif a `aria-current="true"`, les autres non ;
  - `projection: { mode: 'student', studentId: B }` → la ligne de B contient `getByLabelText('Projeté')`, pas les autres ; `mode: 'waiting'` → aucune ;
  - clic sur B → en base `activeStudentId === B` et `projection` inchangée (`toEqual`), et l'onglet « Étudiants » reste sélectionné (`aria-selected="true"`) ;
  - aller-retour A → B → A avec une attempt `pending` sur A : de retour sur A, la question en cours s'affiche et en base l'attempt de A est `toEqual` à l'initiale ;
  - notes : todo « 0 · — » ; done avec ajustement → texte contenant la note finale formatée (calculer l'attendu avec `formatScore(computeScores(...).final, 'final', config, 'fr')`) ; absent → `config.absent.label` et aucune note ;
  - `activeStudentId` orphelin → aucun bouton en `aria-current`.
- [ ] **Step 2: Test en-tête** (dans `examiner-view.test.tsx`) : `queryByRole('combobox', { name: 'Étudiant' })` est `null`.
- [ ] **Step 3: Lancer** `pnpm vitest run src/features/session/students-tab.test.tsx` — Expected: FAIL.
- [ ] **Step 4: Implémenter** `student-status-label.ts`, `StudentRow` (voir spec § `StudentRow` : `<li><button aria-current>`, deux lignes, `IconDeviceDesktop` avec `aria-label`, surlignage `bg-accent border-primary` pour l'actif), `StudentsTab` (garde : `onSelect` n'est pas appelé si l'étudiant cliqué est déjà actif ; pied `actionsSlot` rendu même vide dans un `<div>`), puis le câblage `SidePanel` / `ExaminerView`, le retrait de `picker` et la suppression de `student-picker.tsx` et des clés i18n.
- [ ] **Step 5: Réécrire les tests existants** qui changeaient d'étudiant par le `combobox` : ouvrir l'onglet « Étudiants » et cliquer sur le bouton de l'étudiant. Les assertions « valeur vide / aucun étudiant sélectionné » deviennent « aucun bouton en `aria-current` ».
- [ ] **Step 6: Lancer** `pnpm check` — Expected: vert (dont `pnpm deps`, et aucune clé i18n orpheline).
- [ ] **Step 7: Commit** — `✨ Ajoute l'onglet « Étudiants » et retire le sélecteur provisoire de l'en-tête`.

### Task 4: Dialogue d'ajout d'étudiant

**Files:**
- Create: `src/features/session/components/add-student-dialog.tsx`
- Create: `src/features/session/add-student.test.tsx`
- Modify: `src/features/session/components/students-tab.tsx` (bouton « Ajouter un étudiant » en tête d'onglet, ouvre le dialogue), `src/features/session/components/examiner-view.tsx` (câblage `onAdd`)
- Modify: `src/lib/i18n/ui-messages.ts`

**Interfaces:**
- Consumes: `findDuplicate` (Task 1) ; `actions.addStudent` (Task 2) ; `StudentsTab` (Task 3).
- Produces:
  - `StudentsTab` gagne la prop `onAdd: (names: { lastName: string; firstName: string }, options: { activate: boolean }) => Promise<boolean>`, câblée dans `ExaminerView` sur `actions.addStudent`.
  - `AddStudentDialog` props : `{ ui: Ui; session: Session; disabled: boolean; onAdd: <même type> }` (le dialogue porte son propre bouton déclencheur).
- Clés i18n (fr / en) : `students_add` « Ajouter un étudiant » / « Add a student » ; `students_add_title` « Ajouter un étudiant » / « Add a student » ; `students_add_last_name` « Nom » / « Last name » ; `students_add_first_name` « Prénom » / « First name » ; `students_add_submit` « Ajouter » / « Add » ; `students_add_and_start` « Ajouter et faire passer » / « Add and start » ; `students_add_duplicate` `({ name })` « {name} est déjà dans la liste. » / « {name} is already in the list. » (`name` = « Nom Prénom » de l'étudiant **existant**).

- [ ] **Step 1: Tests `add-student.test.tsx`** (même montage que Task 3) :
  - dialogue ouvert : « Ajouter » et « Ajouter et faire passer » désactivés à vide, et avec « Nom » = `'   '` + « Prénom » = `'Zoé'` ; aucun `role="status"` de doublon dans ce second cas ;
  - saisie `' durand '` / `'ÉLODIE'` face à « Durand Élodie » existant → `getByRole('status')` contient « Durand Élodie est déjà dans la liste. », boutons actifs ;
  - « Ajouter » → en base un étudiant de plus, dernier, `addedDuringSession: true`, `activeStudentId` inchangé ; le dialogue est fermé ; réouvert, ses champs sont vides ;
  - « Ajouter et faire passer » alors que l'étudiant actif A a une attempt `pending` → le corps affiche le passage du nouvel étudiant (son nom dans l'en-tête, grille de tirage), l'onglet « Étudiants » reste sélectionné, `projection` inchangée ; puis clic sur A → sa question en cours est de retour ;
  - double clic rapide sur « Ajouter et faire passer » (deux `fireEvent.click` synchrones) → un seul étudiant ajouté ;
  - Entrée dans le champ « Prénom » (soumission du `<form>`) → ajoute sans activer ;
  - Échap après saisie puis réouverture → champs vides.
- [ ] **Step 2: Lancer** `pnpm vitest run src/features/session/add-student.test.tsx` — Expected: FAIL.
- [ ] **Step 3: Implémenter** `AddStudentDialog` : `Dialog` shadcn contrôlé, `<form onSubmit>` = « Ajouter » ; « Ajouter et faire passer » en `type="button"` ; les deux désactivés si un champ trimé est vide ou `disabled` ; avertissement `<p role="status">` quand `findDuplicate` renvoie un étudiant ; fermeture + remise à zéro quand `onAdd` renvoie `true`, dialogue laissé ouvert sinon ; remise à zéro aussi à toute fermeture (`onOpenChange(false)`). Garde locale `submitting` (ref) pour que les deux boutons n'envoient qu'un appel pendant l'écriture, en plus du verrou de `run`.
- [ ] **Step 4: Lancer** `pnpm check` — Expected: vert.
- [ ] **Step 5: Commit** — `✨ Ajoute le dialogue d'ajout d'étudiant en cours de session`.
