# F12 — Side panel, onglet « Étudiant » — Design

- **Date** : 2026-09-29
- **Ticket** : [#12](https://github.com/AdrienGras/questionator-z4000-hyperdrive/issues/12)
- **Branche** : `feat/f12-side-panel`
- **Statut** : spec validée en conversation, figée ici avant le plan d'implémentation.

## Contexte

F09 a réservé à droite de l'écran de passage un `<aside>` vide (D64). F11 a livré l'écran final, qui affiche déjà, pour un étudiant terminé, le détail des questions et les cinq notes. Pendant le passage, l'examinateur ne peut encore ni corriger une note déjà saisie, ni écrire un commentaire, ni déclarer un étudiant absent : `AbsentState` renvoie à un panneau « bientôt disponible ».

Le modèle porte déjà `Attempt.editedAt`, `Student.comment` et `Student.absent`. `resetStudent` (F11) vide attempts, ajustement et révélation en conservant le commentaire (D07).

## Objectif

Le panneau latéral de la vue examinateur, repliable, à deux onglets, et son onglet « Étudiant » : questions tirées avec correction de note, totaux, commentaire sauvegardé automatiquement, bascule d'absence. L'onglet « Étudiants » reste un emplacement pour F13.

## Décisions (D67)

- **Composants partagés avec l'écran final.** La liste des questions et la liste des notes sortent de `FinalScreen` en deux composants (`AttemptList`, `ScoreList`) réutilisés par le panneau. L'écran final reste complet, panneau replié ou non ; le panneau est la surface de correction. Le doublon visuel ne se voit que panneau ouvert sur un étudiant terminé.
- **Absence garantie par le domaine.** `setAbsent(…, { absent: true })` réinitialise l'étudiant (via `resetStudent`) et le marque absent dans la même transition, donc la même transaction : l'invariant « un absent n'a jamais d'attempt » (D08) ne dépend pas de l'écran. La confirmation reste une affaire d'interface.
- **Pas d'écriture sans changement.** Si le mutator de `updateSession` renvoie la session reçue (même référence), rien n'est écrit et `updatedAt` ne bouge pas. Les transitions sans effet (même note, même commentaire, même statut d'absence) renvoient leur entrée telle quelle. La sauvegarde du commentaire au blur ne réécrit donc pas la session pour rien, et `editedAt` n'est posé que sur un vrai changement.

## Architecture

```
src/lib/db/sessions.ts                 updateSession : pas de put si le mutator renvoie la session reçue
src/domain/passage/
  edit-score.ts                        editScore
  comment.ts                           setComment
  absent.ts                            setAbsent
  errors.ts / messages.ts              + not_scored
src/features/session/
  side-panel-state.ts                  lecture / écriture localStorage (ouvert, onglet)
  hooks/use-autosave.ts                sauvegarde différée + au blur + flush au démontage
  hooks/use-passage-actions.ts         + editScore, setComment, setAbsent
  components/attempt-list.tsx          extrait de final-screen.tsx, mode éditable
  components/score-list.tsx            extrait de final-screen.tsx, « — » avant la fin
  components/side-panel.tsx            aside repliable + onglets
  components/student-tab.tsx           onglet « Étudiant »
  components/comment-field.tsx         textarea + indicateur
  components/absent-toggle.tsx         case + AlertDialog de confirmation
  components/final-screen.tsx          utilise AttemptList / ScoreList (lecture seule)
  components/absent-state.tsx          texte mis à jour
src/components/ui/tabs.tsx, textarea.tsx   ajout shadcn (base-ui)
```

## `lib/db` — `updateSession`

Après `const next = mutator(current)` : si `next === current`, renvoyer `current` sans `put` ni nouvel `updatedAt`. Le contrôle d'identifiant reste avant. Test : un mutator identité ne change ni `updatedAt` ni le document, et `put` n'est pas appelé.

Conséquence : un mutator ne doit plus modifier la session **en place** puis la renvoyer (elle ne serait pas écrite). Tous les mutators actuels sont déjà immuables (transitions de `domain/passage/`, `withExaminer`, renommage de `session-card.tsx`). Le squelette CONVENTIONS « Mutation de session », qui autorisait la modification en place, est corrigé en conséquence, et la docstring d'`updateSession` le dit.

## Domaine — `src/domain/passage/`

### `errors.ts` et `messages.ts`

| Code | Cas | Message fr | Message en |
|---|---|---|---|
| `not_scored` | modifier la note d'une question passée ou en cours | « Seule une question notée peut être corrigée. » | « Only a scored question can be corrected. » |

### `edit-score.ts` — `editScore`

`editScore(session, { studentId, attemptId, score }, { now })` :

1. `requireStudent` ;
2. attempt introuvable → `attempt_not_found` ;
3. `outcome !== 'scored'` → `not_scored` ;
4. catégorie introuvable → `category_not_found` ; `score` hors `category.scale` → `score_not_in_scale` ;
5. `score === attempt.score` → session renvoyée telle quelle ;
6. sinon `score` remplacé et `editedAt = now().toISOString()`.

Aucun contrôle de statut : un étudiant terminé se corrige (sa finale est recalculée par `computeScores`), un étudiant en cours aussi.

### `comment.ts` — `setComment`

`setComment(session, { studentId, comment })` : `requireStudent` ; commentaire trimé ; vide → clé `comment` omise ; identique au commentaire stocké (après trim, absence = vide) → session renvoyée telle quelle. Pas de limite de longueur (ce n'est pas un motif, D65 ne s'applique pas).

### `absent.ts` — `setAbsent`

`setAbsent(session, { studentId, absent })` : `requireStudent` ; `absent === student.absent` → session renvoyée telle quelle ; `absent: true` → `resetStudent` puis `absent: true` sur le résultat ; `absent: false` → `absent: false` (l'étudiant n'a aucun attempt, il redevient `todo`). `comment` conservé dans les deux sens.

## État du panneau — `side-panel-state.ts`

- Clés globales : `questionator:side-panel:open` (`'true'` / `'false'`) et `questionator:side-panel:tab` (`'student'` / `'students'`).
- `readSidePanelOpen(): boolean` (défaut `true`), `readSidePanelTab(): SidePanelTab` (défaut `'student'`), `writeSidePanelOpen(open)`, `writeSidePanelTab(tab)`. Lecture et écriture dans un try/catch, valeur invalide → défaut, comme `src/lib/appearance/color-mode.ts`.

## `use-autosave.ts`

`useAutosave(save: (value: string) => Promise<boolean>, delay = 500)` renvoie `{ schedule(value), flush(), status }` :

- `schedule(value)` arme (ou réarme) un minuteur de `delay` ms ;
- `flush()` annule le minuteur et sauvegarde tout de suite la dernière valeur programmée, s'il y en a une ;
- au démontage, `flush()` ;
- `status` : `'idle' | 'saving' | 'saved' | 'error'` ; `saving` pendant l'écriture, `saved` si `save` résout vrai, `error` sinon.
- échec (`save` résout `false`, rejette ou lève) : la valeur redevient en attente, sauf si une plus récente a été programmée entre-temps ; le prochain `flush()` (blur, démontage) la retente ;
- seule la dernière sauvegarde lancée fixe `status` : une plus ancienne qui se résout tard ne l'écrase pas.

## Écran — `src/features/session/`

### `SidePanel`

Remplace `<aside aria-hidden="true" />` dans `ExaminerView`. `<aside aria-label="Panneau latéral">` à droite sur grand écran (`lg:`), sous le contenu en dessous. Ouvert : largeur ~22 rem, bouton « Masquer le panneau », puis les onglets. Fermé : seul le bouton « Afficher le panneau ». Le bouton porte `aria-expanded` et `aria-controls` (id du contenu). État initial lu dans `localStorage`, écrit à chaque changement.

Onglets (`tabs` shadcn/base-ui) : « Étudiant » → `StudentTab` ; « Étudiants » → texte « Liste des étudiants — bientôt disponible. » (F13).

### `AttemptList` (extrait de `FinalScreen`)

Props : `ui`, `config`, `attempts`, `disabled`, `onEditScore?: (attemptId, score) => void`. Même rendu que l'écran final de F11 (rang des seules questions notées, accent de catégorie en bordure, catégorie, titre), avec un cas de plus : « En cours » pour un attempt `pending`. Avec `onEditScore`, le résultat d'une question notée devient un `<select>` natif des valeurs du barème (formatées `raw`) suivi de « / max » ; libellé accessible « Note de la question {rang} » ; `disabled` pendant `busy`.

### `ScoreList` (extrait de `FinalScreen`)

Props : `ui`, `config`, `student`. Les cinq notes de l'écran final ; convertie et finale affichent « — » tant que `computeScores` les renvoie `null` (D21). `FinalScreen` l'utilise tel quel : rendu inchangé.

### `StudentTab`

- Sans étudiant actif : « Aucun étudiant sélectionné. »
- Sinon, sections titrées : « Questions » (`AttemptList` éditable, ou « Aucune question tirée »), « Totaux » (`ScoreList`), « Commentaire » (`CommentField`), puis `AbsentToggle`.

### `CommentField`

`<Label>` « Commentaire » + `textarea`, état local initialisé depuis `student.comment` et monté avec `key={student.id}` (la liveQuery n'écrase jamais la frappe). `onChange` → `schedule`, `onBlur` → `flush`. Indicateur `aria-live="polite"` : rien (`idle`), « Enregistrement… », « Enregistré », « Échec de l'enregistrement ».

### `AbsentToggle`

Case à cocher « Absent ». Cocher sans attempt → `setAbsent(student.id, true)` direct. Cocher avec attempts → `AlertDialog` « Déclarer {Nom Prénom} absent ? », corps « Ce passage contient {n} question(s) tirée(s). Déclarer l'étudiant absent les supprime. Le commentaire est conservé. », boutons « Annuler » / « Déclarer absent » (destructif) ; succès → fermeture, échec → `write_error`, dialogue ouvert, boutons désactivés pendant l'écriture (motif F11). Décocher → `setAbsent(student.id, false)` direct. L'étudiant, son nom et le nombre de questions sont figés à l'ouverture du dialogue.

### `AbsentState`

Corps : « Décochez « Absent » dans le panneau pour le faire passer. »

### `use-passage-actions.ts`

`editScore(attemptId, score): Promise<void>` et `setAbsent(studentId, absent): Promise<boolean>` passent par `run` (garde, `busy`, erreur). Pour une écriture sans changement, `updateSession` renvoie l'`updatedAt` déjà connu : `busy` retombe aussitôt. `setAbsent` prend l'étudiant en paramètre : `AbsentToggle` le fige à l'ouverture du dialogue, un changement d'étudiant actif pendant qu'il est ouvert (autre onglet) ne détourne pas la déclaration.

`setComment(studentId, comment): Promise<boolean>` appelle `updateSession` **directement**, hors de `run` : résout `true`, ou `false` en cas d'erreur, sans toucher à la garde, à `busy` ni à `error`.

**Note** : le commentaire ne passe pas par `run`. Il ne touche ni aux attempts ni à l'étudiant actif, il n'a donc rien à craindre d'une action en vol ; passé par la garde, il serait ignoré pendant un tirage ou une correction (écriture perdue), verrouillerait les boutons de passage le temps de chaque sauvegarde différée et effacerait une erreur de passage affichée. Les écritures concurrentes restent sérialisées par la transaction Dexie de `updateSession`.

### Traductions

Nouvelles clés `panel_*` (bascule, onglets, emplacement F13), `student_tab_*` (titres, vide), `attempt_pending`, `attempt_score_select`, `comment_*` (libellé, états), `absent_*` (case, dialogue) en fr et en ; `passage_absent_body` reformulée.

## Tests

- **`updateSession`** : mutator identité → ni `put` ni changement d'`updatedAt`.
- **`editScore`** : nominal (`score` et `editedAt`) ; même valeur → session identique (`toBe`) ; `not_scored` sur passée et en cours ; `score_not_in_scale` ; `attempt_not_found` ; `student_not_found` ; finale recalculée sur un étudiant terminé (`computeScores`).
- **`setComment`** : trim ; vide → clé omise ; identique → `toBe` ; `student_not_found`.
- **`setAbsent`** : avec attempts, ajustement et `finalRevealedAt` → tout vidé, `absent`, commentaire conservé ; sans attempt ; `false` → `todo` ; sans changement → `toBe`.
- Refus : session d'entrée intacte.
- **`side-panel-state`** : défauts, valeur invalide, stockage qui lève.
- **`useAutosave`** (faux minuteurs) : sauvegarde à 500 ms, réarmement, `flush` au blur, flush au démontage, statuts.
- **Écran** :
  - panneau replié puis rechargé → reste replié ; onglet actif mémorisé ;
  - étudiant en cours : « — » pour convertie et finale, « En cours » dans la liste ;
  - note corrigée par le sélecteur : `editedAt` en base, finale de l'écran final mise à jour ;
  - commentaire : sauvegardé après le délai et au blur, indicateur « Enregistré », survit au rechargement et à la réinitialisation (F11) ;
  - absent sans attempt : direct ; avec attempts : confirmation, attempts supprimés, commentaire conservé, `AbsentState` affiché ; décocher → grille de tirage ;
  - `FinalScreen` inchangé (ses tests restent verts).
- **Navigateur** : Chromium, session d'exemple, clair et sombre, grand écran et largeur réduite.

## Critères d'acceptation

- [ ] Modifier une note d'un étudiant terminé met à jour sa note finale partout (écran final, panneau ; la vue projetée suivra par la même liveQuery en F14).
- [ ] Un étudiant absent n'a jamais d'attempt.
- [ ] Le commentaire survit au rechargement et à la réinitialisation.
- [ ] L'état ouvert / fermé et l'onglet actif du panneau survivent au rechargement.

## Hors périmètre

- Onglet « Étudiants » (F13), retrait du sélecteur d'étudiant provisoire (F13).
- Vue projetée (F14).
