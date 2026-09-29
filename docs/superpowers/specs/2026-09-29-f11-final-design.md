# F11 — Écran final et ajustement — Design

- **Date** : 2026-09-29
- **Ticket** : [#11](https://github.com/AdrienGras/questionator-z4000-hyperdrive/issues/11)
- **Branche** : `feat/f11-final`
- **Statut** : spec validée en conversation, figée ici avant le plan d'implémentation.

## Contexte

Depuis F09, un étudiant dont les `questionsPerStudent` questions sont notées tombe sur `DoneState`, un état provisoire qui n'affiche que le score brut (D64). Il n'existe encore aucun moyen de fixer la note finale, de corriger une erreur de manipulation (un skip n'est pas annulable, F10) ni de passer à l'étudiant suivant autrement que par le sélecteur provisoire.

Le moteur de notation (F03) sait déjà tout calculer : `computeScores` rend brute, plafonnée, convertie, ajustement et finale (arrondir puis borner, D20), `isValidAdjustment` vérifie qu'une valeur est un multiple du pas (D02, D44), `formatScore` met en forme. Le modèle porte déjà `Student.adjustment`, `Student.comment` et `Student.finalRevealedAt` (D31).

## Objectif

Remplacer `DoneState` par l'écran final de la vue examinateur : toutes les notes, le détail du passage, et trois actions — ajuster, réinitialiser l'étudiant, passer à l'étudiant suivant.

## Écart avec le ticket (D66)

Le ticket déclenche l'ouverture automatique de la popup d'ajustement par un état local, non persisté, posé par la dernière note. Un rechargement entre la dernière note et la fermeture de la popup, ou un étudiant terminé avant F11, laisserait alors `finalRevealedAt` vide pour toujours : seule la fermeture de cette popup révèle la note (D31).

L'ouverture automatique est donc **déduite de la base** : la popup s'ouvre en mode « fin de passage » tant que l'étudiant est `done` et que `finalRevealedAt` est vide. Sa fermeture (enregistrer ou annuler) renseigne le champ : elle ne s'ouvre bien qu'une fois, et survit au rechargement.

Le ticket décrit aussi la mutation « Étudiant suivant » comme `activeStudentId ← nextStudent(...)` calculé par l'écran. Le suivant est calculé **dans la transaction**, sur la session fraîche (deux onglets examinateur, même principe que F09).

## Architecture

```
src/domain/passage/
  reason.ts            normalizeReason, MAX_REASON_LENGTH (sorti de skip.ts)
  adjust.ts            setAdjustment
  reveal.ts            revealFinal
  reset.ts             resetStudent
  active-student.ts    + goToNextStudent
  selectors.ts         + nextStudent, shouldAutoOpenAdjustment
  errors.ts            + student_not_done, adjustment_invalid, no_next_student
  messages.ts          + messages fr/en des trois codes
src/domain/scoring/
  adjustment.ts        + parseAdjustmentInput, previewFinal
src/features/session/
  hooks/use-passage-actions.ts   + adjust, revealFinal, reset, next
  components/final-screen.tsx     remplace done-state.tsx (supprimé)
  components/adjustment-dialog.tsx
  components/reset-dialog.tsx
```

Les transitions restent pures, `(session, input, deps?) → session`, et lèvent une `PassageError` sans jamais modifier leur entrée (CONVENTIONS « Transition de passage »). Le hook les passe à `updateSession`.

## Domaine

### `reason.ts`

- `MAX_REASON_LENGTH = 200` remplace `MAX_SKIP_REASON_LENGTH` (D65), désormais partagé par le motif de skip et la justification d'ajustement.
- `normalizeReason(reason: string | undefined): string | undefined` : trim, troncature à `MAX_REASON_LENGTH`, `undefined` si vide. `skipAttempt` l'utilise ; son comportement ne change pas.

### `errors.ts` et `messages.ts`

Trois codes de plus, avec message fr et en :

| Code | Cas | Message fr |
|---|---|---|
| `student_not_done` | ajuster ou révéler un étudiant dont le passage n'est pas terminé | « Le passage de cet étudiant n'est pas terminé. » |
| `adjustment_invalid` | valeur refusée par `isValidAdjustment` | « L'ajustement doit être un multiple du pas d'arrondi, au plus la note maximale. » |
| `no_next_student` | aucun étudiant à passer ou en cours | « Tous les étudiants sont passés. » |

### `adjust.ts` — `setAdjustment`

`setAdjustment(session, { studentId, value, reason? })` :

1. `requireStudent` ;
2. `studentStatus(...) !== 'done'` → `student_not_done` (un absent n'est jamais `done`) ;
3. `!isValidAdjustment(value, config)` → `adjustment_invalid` ;
4. `value === 0` → l'étudiant perd `adjustment` (justification comprise, D29) ;
5. sinon `adjustment = { value, reason: normalizeReason(reason) }`, la clé `reason` omise si `undefined`.

### `reveal.ts` — `revealFinal`

`revealFinal(session, { studentId }, { now })` :

1. `requireStudent` ;
2. pas `done` → `student_not_done` ;
3. `finalRevealedAt` déjà renseigné → session renvoyée telle quelle (idempotent, la première date fait foi) ;
4. sinon `finalRevealedAt = now().toISOString()`.

### `reset.ts` — `resetStudent`

`resetStudent(session, studentId)` : `requireStudent`, puis l'étudiant perd `attempts` (vidé), `adjustment` et `finalRevealedAt`. `comment` et `absent` sont conservés (D07). Aucun autre refus : la transition est valable dans tout statut, F12 la combinera avec la bascule d'absence (D08).

### `selectors.ts`

- `nextStudent(session, currentId): string | null` : les étudiants triés par `order` ; on parcourt ceux qui suivent `currentId`, puis on reprend au début ; le premier dont le statut est `todo` ou `in_progress` est retenu. `currentId` n'est jamais renvoyé. `currentId` inconnu : parcours depuis le début. Aucun candidat : `null`.
- `shouldAutoOpenAdjustment(student, config): boolean` : `studentStatus(...) === 'done' && student.finalRevealedAt === undefined`.

### `active-student.ts` — `goToNextStudent`

`goToNextStudent(session, currentId)` : `nextStudent(session, currentId)` sur la session reçue ; `null` → `no_next_student` ; sinon `setActiveStudent(session, id)`. `projection` n'est jamais touchée.

### `domain/scoring/adjustment.ts`

- `parseAdjustmentInput(text: string): number | null` : trim, espaces internes retirés, virgule acceptée comme séparateur décimal, signe `+` ou `-` (et le signe moins typographique `−`) en tête. Texte vide, `NaN`, plus de trois décimales → `null`. Le contrôle du pas reste `isValidAdjustment`.
- `previewFinal(student, config, value): { converted: Milli; adjustment: Milli; final: Milli; clamped: boolean }` : `computeScores` sur une copie de l'étudiant portant `adjustment: { value }`. `clamped` vaut vrai si `converted + adjustment` sort de `[0, finalScale]`. Précondition : étudiant `done` et `value` valide (sinon `converted`/`final` seraient `null`) ; l'appelant ne l'utilise que dans ce cas et lève sinon.

## Écran — `src/features/session/`

### Flux de données

`ExaminerView` → `PassageBody` → `FinalScreen` pour un étudiant `done`. `FinalScreen` reçoit l'étudiant, la config, la session (pour `nextStudent`), `busy`, et les actions du hook. L'en-tête ne change pas : la progression reste masquée pour un étudiant `done`.

### `FinalScreen`

De haut en bas :

1. **Notes** (`<dl>`) : brute et plafonnée au format `raw` ; convertie, ajustement et finale au format `final`. L'ajustement est signé (« +1 », « −0,5 ») suivi de sa justification en texte secondaire, ou « aucun ». La finale est mise en avant : « 14,5 / 20 ». `presentation.finalScoreDisplay` ne s'applique pas ici (D29).
2. **Détail du passage** (`<ol>`) : chaque attempt dans l'ordre. Rang (il ne compte que les questions notées, comme `Question n / N` ; une question passée n'a pas de rang), catégorie avec son accent de couleur (comme la grille), titre de la question ; à droite « 2 / 3 » (points / max du barème de la catégorie) pour une question notée, ou « Passée » suivi du motif.
3. **Actions** : « Ajuster » ; « Réinitialiser l'étudiant » (variante destructive) ; « Étudiant suivant » (variante principale, D29). Sans candidat : bouton `disabled` et mention visible « Tous les étudiants sont passés » en dessous (texte, pas infobulle : rien à survoler pour la comprendre).

Tous les boutons sont désactivés pendant `busy`.

### `AdjustmentDialog`

- **Ouverture** : `shouldAutoOpenAdjustment(student, config) || ouvertureManuelle`. Le mode est figé à l'ouverture : « fin de passage » si l'ouverture est automatique, « ajuster » sinon.
- **Formulaire** dans un composant enfant démonté à la fermeture (CONVENTIONS « Dialogue de saisie »), prérempli avec l'ajustement actuel (`0` s'il n'y en a pas) et sa justification.
- **Champ** texte `inputMode="decimal"` (un `type="number"` refuse la virgule selon le navigateur), encadré de boutons « − » et « + » qui retirent ou ajoutent un pas (`stepMilli`) à la valeur courante si elle est valide, à 0 sinon. Valeur non analysable ou hors pas : message sous le champ (`aria-invalid`, `aria-describedby`), « Enregistrer » désactivé.
- **Calcul en direct** dans une zone `aria-live="polite"`, pour une valeur valide : « 13,5 + 1 = 14,5 / 20 », puis « (bornée à 20) » ou « (bornée à 0) » si `clamped`.
- **Justification** facultative, `maxLength={MAX_REASON_LENGTH}`.
- **Enregistrer** : mode « fin de passage » → `adjust(value, reason, { reveal: true })`, soit `revealFinal(setAdjustment(s, …))` en une seule écriture ; mode « ajuster » → `adjust(value, reason, { reveal: false })`.
- **Annuler** (bouton, Échap, clic hors du dialogue) : mode « fin de passage » → `revealFinal()` ; mode « ajuster » → rien.
- L'action renvoie une promesse : succès → fermeture ; échec → `write_error` en `role="alert"`, dialogue ouvert. En mode « fin de passage », tant que `finalRevealedAt` n'est pas écrit, l'ouverture automatique garde la popup ouverte : c'est voulu.

### `ResetDialog`

`AlertDialog` : titre « Réinitialiser Durand Alice ? », corps « Les questions tirées, les notes et l'ajustement seront supprimés. Le commentaire est conservé. », boutons « Annuler » et « Réinitialiser » (destructif). Après confirmation, l'étudiant redevient « à passer » et reste l'étudiant actif : la grille de F09 réapparaît.

### `use-passage-actions.ts`

Quatre actions de plus, toutes via `run` (garde `useRef` et `busy` inchangés) :

- `adjust(value, reason, { reveal })` et `revealFinal()` : pour le dialogue, elles **renvoient** l'issue (`Promise<boolean>`, vrai si l'écriture a réussi) en plus de renseigner `error` ;
- `reset()` ;
- `next()` : `goToNextStudent(session, studentId)`.

`revealFinal` et `setAdjustment` reçoivent `now` et les autres dépendances de façon synchrone, dans le mutator.

### Traductions

Nouvelles clés `final_*` (titres de section, libellés des notes, « aucun », « Passée », actions, mention « Tous les étudiants sont passés ») et `adjust_*` / `reset_*` (dialogues, erreurs du champ, ligne de calcul, mention de bornage), en fr et en. `passage_done_body` n'était utilisée que par `DoneState` : elle est retirée. `passage_done_title` (« Passage terminé ») sert de titre à `FinalScreen`. `passage_raw_score` reste utilisée par `PassageHeader`.

## Tests

- **`reason`** : trim, troncature, vide → `undefined` ; `skipAttempt` inchangé (ses tests restent verts).
- **`setAdjustment`** : nominal, avec et sans justification ; justification normalisée ; 0 supprime ajustement et justification ; `adjustment_invalid` (hors pas, au-delà de `finalScale`) ; `student_not_done` (en cours, absent) ; `student_not_found`.
- **Moteur, via `setAdjustment` puis `computeScores`** : 20/20 avec +1 → 20 ; ajustement négatif sous 0 → 0 ; `13,5 + 1 = 14,5`.
- **`revealFinal`** : renseigne la date ; idempotent ; `student_not_done`.
- **`resetStudent`** : attempts, ajustement et `finalRevealedAt` supprimés ; commentaire et `absent` conservés ; statut `todo`.
- **`nextStudent` / `goToNextStudent`** : saute terminés et absents ; inclut les en cours ; reprend au début ; jamais le courant ; `null` / `no_next_student` si personne ; `projection` inchangée.
- **`parseAdjustmentInput`** : `1`, `1,5`, `1.5`, `+1`, `-0,5`, `−0,5`, espaces, vide, texte, quatre décimales.
- **`previewFinal`** : sans bornage, bornage haut, bornage bas.
- Chaque refus vérifie la session d'entrée intacte.
- **Écran** (intégration par la route, comme `examiner-view.test.tsx`) :
  - la dernière note ouvre la popup en mode « fin de passage » ;
  - un étudiant `done` sans `finalRevealedAt` ouvre la popup au montage (rechargement) ;
  - un étudiant déjà révélé ne l'ouvre pas ; « Ajuster » l'ouvre ;
  - Annuler en fin de passage renseigne `finalRevealedAt` sans ajustement ; Annuler en mode « ajuster » n'écrit rien ;
  - Enregistrer persiste valeur et justification, et révèle en fin de passage ;
  - calcul en direct, mention de bornage, « Enregistrer » désactivé hors pas, boutons − / + ;
  - notes et détail du passage affichés, skip avec motif compris ;
  - réinitialisation : confirmation, commentaire conservé, grille de retour ;
  - « Étudiant suivant » : change l'étudiant actif, `projection` inchangée ; désactivé avec la mention quand il ne reste personne.
- **Navigateur** : Chromium avec la session d'exemple, en clair et en sombre ; Lefèvre Chloé (terminée avant F11, non révélée) doit ouvrir la popup automatiquement.

## Critères d'acceptation

- [ ] Un étudiant à 20/20 avec un ajustement de +1 reste à 20.
- [ ] La justification de l'ajustement est persistée (son affichage dans l'export est vérifié en F16).
- [ ] La réinitialisation conserve le commentaire.
- [ ] « Étudiant suivant » ne modifie pas la vue projetée.
- [ ] La popup de fin de passage s'ouvre une seule fois, y compris après un rechargement, et sa fermeture renseigne `finalRevealedAt`.

## Hors périmètre

- Écran final de la vue projetée (F14), export (F16).
- Bascule d'absence (F12), qui réutilisera `resetStudent`.
- Modification d'une note déjà saisie (F12).
