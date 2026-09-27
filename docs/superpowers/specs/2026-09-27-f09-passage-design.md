# F09 — Écran de passage (vue examinateur) — Design

- **Date** : 2026-09-27
- **Ticket** : [#9](https://github.com/AdrienGras/questionator-z4000-hyperdrive/issues/9)
- **Branche** : `feat/f09-passage`
- **Statut** : spec validée en conversation, figée ici avant le plan d'implémentation.

## Contexte

C'est le cœur de l'application. L'étudiant choisit une catégorie, l'application tire une question, l'examinateur note, jusqu'à `questionsPerStudent` questions notées. Chaque action est écrite en base au moment où elle a lieu (PRODUCT §3.3).

L'écran `#/session/$sessionId` existe depuis F07, mais son corps est provisoire (D60) : en-tête, liste des catégories, bouton désactivé. `<Markdown>` (F08) n'est encore monté nulle part. `activeStudentId` est fixé au premier étudiant par `buildSession` (F06), et rien ne permet d'en changer avant F11 (« Étudiant suivant ») ou F13 (side panel « Étudiants »).

Références : [`PRODUCT.md`](https://github.com/AdrienGras/questionator-z4000-hyperdrive/blob/main/PRODUCT.md) §3, §7, F09 · [`docs/DECISIONS.md`](https://github.com/AdrienGras/questionator-z4000-hyperdrive/blob/main/docs/DECISIONS.md) D06, D21, D22, D26, D28, D59, D60, D64.

## Objectif

La vue examinateur d'un passage : grille des catégories, tirage uniforme sans biais, affichage de la question et de ses éléments de réponse (repliés par défaut), notation par le barème de la catégorie, puis état terminé. Aucune combinaison de clics ou d'onglets ne crée deux tirages.

## Écart avec le ticket (D64)

- **Emplacement et signatures.** Le ticket place la logique dans `src/passage/` et décrit `drawQuestion(sessionId, …)`. Il est antérieur à D59, et `domain/` n'importe pas `lib/db/`. La logique va dans `src/domain/passage/`, sous forme de transitions pures `(session, input, deps) → session`. Un hook de la feature les passe à `updateSession`. Les invariants restent vérifiés dans la transaction, sur la session fraîche.
- **Sélecteur d'étudiant provisoire.** Sans lui, F09 ne ferait passer que le premier étudiant. Un `<select>` dans l'en-tête écrit `activeStudentId`. F13 le retire.
- **Side panel : structure seule.** La mise en page réserve une colonne `aside`, vide et invisible. F12 y met le panneau et son repli.
- **État terminé provisoire.** Après la dernière note, l'écran affiche le score brut et « écran final à venir ». F11 le remplace.

## Architecture

```
src/domain/passage/random.ts           cryptoRandomInt, pickUniform
src/domain/passage/selectors.ts        availableQuestions, currentPending, questionIndex, isCategoryExhausted
src/domain/passage/errors.ts           PassageError + PassageErrorCode
src/domain/passage/messages.ts         message traduit d'une PassageError
src/domain/passage/draw.ts             drawQuestion
src/domain/passage/score.ts            scoreAttempt
src/domain/passage/active-student.ts   setActiveStudent (provisoire, D64)

src/features/session/hooks/use-passage-actions.ts     draw, score, selectStudent, busy, error
src/features/session/components/examiner-view.tsx     mise en page 2 colonnes, aiguillage des états
src/features/session/components/passage-header.tsx    retour, étudiant, « 2 / 3 », score brut, bascule de mode
src/features/session/components/student-picker.tsx    sélecteur provisoire (D64)
src/features/session/components/category-grid.tsx     grille des catégories
src/features/session/components/question-panel.tsx    énoncé, réponse repliable, boutons de note
src/features/session/components/absent-state.tsx      état « absent »
src/features/session/components/done-state.tsx        état « terminé » provisoire (D64)
```

`session-page.tsx` et la route ne changent pas. Aucune dépendance nouvelle : l'infobulle utilise `components/ui/tooltip.tsx`, le bloc repliable est un `<details>` natif.

Approche retenue : transitions pures dans `domain/`, appliquées par la feature. Deux approches ont été écartées :
- mutations dans `lib/db/` à côté de `updateSession` : des règles de PRODUCT.md dans `lib/`, ce que D59 interdit ;
- un reducer d'événements : surdimensionné pour deux actions ; F10 et F11 ajouteront leurs transitions à côté (`skipAttempt`, `adjustStudent`).

## Domaine — `src/domain/passage/`

### `random.ts`

```ts
type RandomFill = (buffer: Uint32Array) => Uint32Array
export function cryptoRandomInt(n: number, fill: RandomFill = (b) => crypto.getRandomValues(b)): number
export function pickUniform<T>(items: readonly T[], random: (n: number) => number): T
```

- `cryptoRandomInt` lève si `n` n'est pas un entier dans `[1, 2³²]`. Il tire un `Uint32` et le rejette s'il dépasse le plus grand multiple de `n` représentable (`limit = 2³² − (2³² mod n)`), puis renvoie `value % n`. Pas de biais de modulo.
- `pickUniform` lève sur une liste vide, sinon renvoie `items[random(items.length)]`.

### `selectors.ts`

```ts
availableQuestions(student: Student, category: NormalizedCategory): NormalizedQuestion[]
isCategoryExhausted(student: Student, category: NormalizedCategory): boolean
currentPending(student: Student): Attempt | undefined
questionIndex(student: Student, config: NormalizedConfig): { current: number; total: number }
```

- `availableQuestions` exclut toute question de la catégorie déjà présente dans les attempts **de cet étudiant**, quelle que soit l'issue (`pending`, `scored`, `skipped`). Les attempts des autres étudiants ne comptent pas.
- `isCategoryExhausted` : `availableQuestions(...).length === 0`.
- `questionIndex` : `total = questionsPerStudent`, `current = min(scored + 1, total)`, où `scored` compte les attempts notés. Avant le premier tirage : `1 / 3`. Pendant la première question : `1 / 3`. Après sa note : `2 / 3`. Terminé : `3 / 3`. Un skip (F10) ne fait pas avancer le compteur.

### `errors.ts` et `messages.ts`

```ts
export type PassageErrorCode =
  | 'student_not_found'
  | 'category_not_found'
  | 'attempt_not_found'
  | 'student_absent'
  | 'student_done'
  | 'pending_exists'
  | 'category_exhausted'
  | 'not_pending'
  | 'score_not_in_scale'

export class PassageError extends Error {
  constructor(readonly code: PassageErrorCode) { … }
}
```

`messages.ts` traduit un code avec `t` de `@/lib/i18n/i18n`, dans son propre dictionnaire `fr` et `en` indexé par code, comme `domain/config/messages.ts`.

### `draw.ts`

```ts
type DrawDeps = { random: (n: number) => number; newId: () => string; now: () => Date }
export function drawQuestion(
  session: Session,
  input: { studentId: string; categoryId: string },
  deps: DrawDeps,
): Session
```

Contrôles, dans cet ordre, chacun levant une `PassageError` : étudiant introuvable (`student_not_found`), absent (`student_absent`), terminé (`student_done`, par `studentStatus`), attempt déjà `pending` (`pending_exists`), catégorie introuvable (`category_not_found`), catégorie épuisée (`category_exhausted`). Sinon, la question vient de `pickUniform(availableQuestions(...), deps.random)` et la fonction renvoie une **nouvelle** session où l'étudiant a un attempt de plus : `{ id: newId(), categoryId, questionId, drawnAt: now().toISOString(), outcome: 'pending' }`. La session d'entrée n'est pas modifiée.

### `score.ts`

```ts
export function scoreAttempt(
  session: Session,
  input: { studentId: string; attemptId: string; score: number },
): Session
```

Contrôles : étudiant introuvable, attempt introuvable (`attempt_not_found`), attempt non `pending` (`not_pending`), `score` absent du `scale` de la catégorie de l'attempt (`score_not_in_scale`, égalité stricte : les valeurs du barème viennent de la config, les boutons renvoient ces mêmes nombres). Sinon l'attempt passe en `outcome: 'scored'`, `score`. Pas d'`editedAt` : il est réservé aux corrections (F12).

### `active-student.ts`

`setActiveStudent(session, studentId)` : `student_not_found` si l'identifiant n'existe pas, sinon `activeStudentId` mis à jour. Provisoire (D64), mais la transition pourra servir à F11 et F13.

## Écran — `src/features/session/`

### Flux de données

`ExaminerView` lit la `Session` que lui passe `SessionPage` (liveQuery de `useSession`) et ne garde aucune copie locale. Après une écriture, dans cet onglet ou dans un autre, la session relue redescend et l'écran se met à jour. `useUi()` est appelé une fois, dans `ExaminerView`, sous `SessionAppearance` (langue de la config).

### États

| État | Condition | Rendu |
|---|---|---|
| Aucun étudiant actif | `activeStudentId` absent ou introuvable | message + sélecteur |
| Absent | `studentStatus = 'absent'` | `AbsentState` : l'absence s'annule depuis le panneau « Étudiant » (F12, bientôt) |
| Terminé | `studentStatus = 'done'` | `DoneState` : score brut, « écran final à venir » |
| En passage | `todo` ou `in_progress` | grille, puis `QuestionPanel` si un attempt est `pending` |

L'en-tête est affiché dans tous les états où un étudiant est actif ; en états absent et terminé, il ne montre que le nom (ni `2 / 3` ni score brut : `DoneState` affiche déjà le score, et le compteur n'a pas de sens pour un absent). Le sélecteur l'est dans tous les états.

### Mise en page

`main` sur une grille `lg:grid-cols-[1fr_auto]` : la zone principale, et un `aside` vide sans rendu visible, réservé à F12. En-tête pleine largeur au-dessus.

### `PassageHeader`

Lien de retour à l'accueil, titre de l'examen, nom et prénom de l'étudiant, `2 / 3` (`questionIndex`), score cumulé brut : `formatScore(computeScores(student, config).raw, 'raw', config, locale)`. `StudentPicker` et `ColorModeToggle` à droite.

### `StudentPicker` (provisoire, D64)

`<select>` natif avec un `<label>` traduit. Une option par étudiant, dans l'ordre de `order`, libellée « Nom Prénom — statut » (statut traduit : à passer, en cours, terminé, absent). Changer d'option appelle `selectStudent(id)`. Désactivé pendant `busy`.

### `CategoryGrid`

Un bouton par catégorie, dans l'ordre de `config.categories` (déjà trié par `order`) : icône (`CategoryIcon`), libellé, « max N » avec `N = max(scale)` formaté, couleur en accent par `--category-color` (D26, jamais en fond sous du texte).

- Catégorie épuisée pour cet étudiant : bouton `aria-disabled="true"` (clic neutralisé), grisé, avec infobulle « Plus de question disponible dans cette catégorie » (D06). Le bouton est lui-même le déclencheur de l'infobulle et porte le motif en `aria-describedby` vers un texte `sr-only` : un bouton nativement `disabled` n'émet ni survol ni focus, et un `span` focalisable enveloppant tomberait sous Sonar S6845.
- Toute la grille est désactivée si un attempt est `pending` ou si `busy`.
- Clic : `draw(category.id)`.

### `QuestionPanel`

Affiché quand un attempt est `pending`, avec la question et la catégorie qu'il désigne.

- Libellé de la catégorie, titre de la question (`question.title`), énoncé par `<Markdown source={question.prompt} ui={ui} />`.
- Si `question.answer` existe : `<details key={attempt.id}>` avec un `<summary>` traduit (« Éléments de réponse ») et `<Markdown source={question.answer} ui={ui} />`. Replié par défaut, et `key` le remet à zéro à chaque nouvelle question (D28). Sinon, pas de bloc.
- Un bouton par valeur de `scale`, dans l'ordre de la config, libellé par la valeur formatée. Clic : `score(attempt.id, value)`, sans confirmation (D28). Boutons désactivés pendant `busy`.
- Un emplacement vide sous les boutons, réservé à « Passer la question » (F10).

Pas d'animation de tirage (réservée à la vue projetée, F14).

### `use-passage-actions.ts`

```ts
function usePassageActions(sessionId: string, studentId: string | undefined, sessionUpdatedAt: string): {
  draw: (categoryId: string) => Promise<void>
  score: (attemptId: string, value: number) => Promise<void>
  selectStudent: (studentId: string) => Promise<void>
  busy: boolean
  error: PassageError | Error | null
}
```

- Chaque action efface l'erreur, passe `busy` à `true`, appelle `updateSession(sessionId, (s) => transition(s, …))`, puis remet `busy` à `false`.
- `draw` passe `{ random: (n) => cryptoRandomInt(n), newId: () => crypto.randomUUID(), now: () => new Date() }`. Ces appels sont synchrones et se font **dans** le mutator, donc sur la liste fraîche des questions disponibles, sans `await` étranger à Dexie.
- `busy` protège contre le double-clic dans l'interface : garde `useRef` synchrone, et `busy` reste vrai tant que `sessionUpdatedAt` n'a pas rattrapé l'`updatedAt` renvoyé par l'écriture (la liveQuery livre la session écrite quelques millisecondes après la fin de la transaction, QUIRKS). La garantie reste la transaction (`pending_exists` au second tirage).
- Erreur : une `PassageError` s'affiche avec son message traduit, les autres (`SessionNotFoundError`, base indisponible) avec un message générique, dans un `<p role="alert">` au-dessus de la grille.

### Traductions

Nouvelles clés `passage_*` dans `src/lib/i18n/ui-messages.ts`, en `fr` et en `en`, pour l'écran (compteur, score, max, infobulle, réponse, états, sélecteur, statuts). Les messages des codes d'erreur vivent dans le dictionnaire propre de `domain/passage/messages.ts`. Les clés `coming_soon_*` et `session_categories` sont supprimées si plus rien ne les utilise.

## Tests

- `random.test.ts` : `cryptoRandomInt` dans `[0, n)` sur des valeurs extrêmes (0, 2³² − 1) ; rejet exercé par une source simulée qui renvoie d'abord une valeur au-delà de la limite ; `n` invalide lève. `pickUniform` : chaque indice atteint le même nombre de fois avec une source qui parcourt toutes les valeurs ; liste vide lève.
- `selectors.test.ts` : `availableQuestions` exclut `pending`, `scored` et `skipped` de l'étudiant, pas ceux d'un autre ; `isCategoryExhausted` ; `questionIndex` (avant tirage, pendant, après note, terminé, avec un skip).
- `draw.test.ts` : chaque code de refus, session d'entrée intacte ; cas nominal (attempt `pending` complet, question tirée parmi les disponibles).
- `score.test.ts` : refus hors barème, sur attempt non `pending`, introuvable ; cas nominal.
- `active-student.test.ts` : identifiant inconnu refusé ; cas nominal.
- Concurrence (`fake-indexeddb`) : deux `updateSession` lancés ensemble avec `drawQuestion` pour le même étudiant → un seul attempt, le second rejeté en `pending_exists`.
- Composants, écran monté par le routeur mémoire sur une session en base :
  - grille désactivée pendant un `pending` ;
  - avec la config d'exemple, « cauchemar » grisée et son infobulle après ses deux questions tirées ;
  - éléments de réponse repliés, puis repliés à nouveau à la question suivante ;
  - la note qui termine le passage affiche l'état terminé ;
  - état absent ; état sans étudiant actif ;
  - le sélecteur change `activeStudentId` en base ;
  - remontage pendant un `pending` : même question réaffichée ;
  - en-tête : `2 / 3` et score brut formaté.

## Critères d'acceptation

- [ ] Un même étudiant ne peut pas tirer deux fois la même question, y compris une question skippée.
- [ ] Deux étudiants différents peuvent tirer la même question.
- [ ] Recharger la page pendant qu'une question est `pending` réaffiche la même question.
- [ ] Un double-clic sur une catégorie ne crée qu'un seul tirage.
- [ ] Avec le fichier d'exemple, la catégorie à 2 questions est grisée après les avoir tirées toutes les deux.
- [ ] Les éléments de réponse ne s'affichent jamais sans action de l'examinateur.
- [ ] Le sélecteur provisoire permet de faire passer plusieurs étudiants d'une même session.

## Hors périmètre

- Skip (F10), écran final et ajustement (F11), side panel (F12, F13), vue projetée et animation (F14).
- Correction d'une note déjà posée (F12).
- Raccourcis clavier (BACKLOG).
