# F13 — Side panel, onglet « Étudiants » — Design

- **Date** : 2026-09-29
- **Ticket** : [#13](https://github.com/AdrienGras/questionator-z4000-hyperdrive/issues/13)
- **Branche** : `feat/f13-students-tab`
- **Statut** : spec validée en conversation, figée ici avant le plan d'implémentation.

## Contexte

F09 a posé un sélecteur d'étudiant provisoire (`StudentPicker`, `<select>` dans l'en-tête) à retirer par F13 (D64). F12 a livré le panneau latéral repliable à deux onglets ; l'onglet « Étudiants » n'affiche encore que `side_panel_students_soon`.

`setActiveStudent(session, studentId)` existe déjà dans `domain/passage/active-student.ts` et `usePassageActions` l'expose en `selectStudent`. La clé de doublon de F06 (`identityKey`) est privée à `domain/students/parse-csv.ts`. `computeScores` fournit `raw`, `converted` et `final` (ajustement compris).

## Objectif

L'onglet « Étudiants » : liste de la session dans l'ordre de passage, changement d'étudiant actif, ajout d'un étudiant en cours de session, zone d'actions vide pour F15 et F16. Le sélecteur provisoire de l'en-tête disparaît.

## Décisions (D68)

- **La liste affiche la note finale, ajustement compris**, et non la note convertie seule, contrairement à la lettre du ticket (« note convertie »). C'est la note qui sort à l'export, et le sens que F14 donne déjà à « converti » sur la vue projetée. Une note sans ajustement tromperait l'examinateur dès qu'un ajustement existe.
- **Cliquer sur un étudiant ne change pas d'onglet.** Le panneau reste sur « Étudiants », y compris après « Ajouter et faire passer » : le corps de l'écran montre déjà le passage ou l'écran final de l'étudiant choisi, et l'examinateur peut enchaîner les clics.
- **La liste est une `<ul>` de `<button>`**, et non un tableau ou une listbox ARIA : un contrôle par ligne, qu'on atteint avec Tab et qu'on active avec Entrée, sans nouvelle dépendance ; un tableau serait trop large pour un panneau de 22 rem.
- **La clé de doublon de F06 est partagée** (`domain/students/identity.ts`) : un doublon ajouté à la main est détecté exactement comme dans le CSV.

## Architecture

| Fichier | Rôle |
|---|---|
| `src/domain/students/identity.ts` | `identityKey(lastName, firstName)`, extraite de `parse-csv.ts` (qui l'importe) |
| `src/domain/passage/add-student.ts` | transition pure `addStudent` |
| `src/domain/passage/active-student.ts` | `setActiveStudent` renvoie son entrée si l'étudiant est déjà actif (D67) |
| `src/domain/passage/selectors.ts` | `findDuplicate`, `rosterScore` |
| `src/domain/passage/errors.ts`, `messages.ts` | code `student_name_required` (fr et en) |
| `src/features/session/hooks/use-passage-actions.ts` | action `addStudent` |
| `src/features/session/student-status-label.ts` | table `STATUS_KEY` sortie de `student-picker.tsx` |
| `src/features/session/components/students-tab.tsx` | onglet : bouton d'ajout, liste, zone d'actions |
| `src/features/session/components/student-row.tsx` | une ligne de la liste |
| `src/features/session/components/add-student-dialog.tsx` | dialogue d'ajout |
| `src/features/session/components/side-panel.tsx` | prop `studentsTab: ReactNode` |
| `src/features/session/components/passage-header.tsx` | prop `picker` retirée |
| `src/features/session/components/student-picker.tsx` | supprimé |
| `src/lib/i18n/ui-messages.ts` | libellés ajoutés ; `passage_student_picker`, `passage_student_option`, `side_panel_students_soon` retirés s'ils ne servent plus |

## Domaine — `src/domain/`

### `identityKey`

Déplacée telle quelle : sans diacritiques, sans casse, sur des valeurs trimées par l'appelant. `parse-csv.ts` l'importe ; son comportement ne change pas (ses tests restent verts sans modification).

### `addStudent`

```ts
addStudent(
  session: Session,
  input: { lastName: string; firstName: string; activate: boolean },
  deps: { newId: () => string },
): Session
```

- Trime les deux champs ; lève `PassageError('student_name_required')` si l'un est vide après trim (le dialogue le bloque déjà, c'est un filet de sécurité).
- Nouvel étudiant : `id` = `deps.newId()`, `order` = max des `order` existants + 1 (0 si la liste est vide), `addedDuringSession: true`, `absent: false`, `attempts: []`, pas de `comment`, d'`adjustment` ni de `finalRevealedAt`.
- Ajouté en fin de `students`. Si `activate` est vrai, `activeStudentId` pointe sur le nouvel étudiant dans la même transition ; sinon il ne change pas.
- Ne touche jamais à `projection`. Ne refuse pas les doublons. Ne modifie pas la session reçue.

### `setActiveStudent`

Inchangée, sauf qu'elle renvoie la session reçue (même référence) si `studentId` est déjà l'étudiant actif : aucune écriture, `updatedAt` ne bouge pas (D67).

### Sélecteurs

- `findDuplicate(session, { lastName, firstName }): Student | undefined` : premier étudiant (ordre `order`) dont `identityKey` égale celle des valeurs trimées ; `undefined` si l'un des champs est vide.
- `rosterScore(student, config)` renvoie `{ kind: 'absent' } | { kind: 'scored'; raw: Milli; final: Milli | null }`. `final` vaut `computeScores(...).final`, `null` tant que le passage n'est pas terminé. Le formatage (libellé `absent.label`, « — », `formatScore`) reste dans le composant.

## Hook — `usePassageActions`

`addStudent(names: { lastName: string; firstName: string }, options: { activate: boolean }): Promise<boolean>` passe par `run` (verrou `inFlight`, `busy`, erreur affichée), avec `newId: () => crypto.randomUUID()` calculé dans le mutator. Un double clic sur un bouton du dialogue ne crée donc jamais deux étudiants.

`selectStudent` ne change pas.

## Écran — `src/features/session/`

### `StudentsTab`

Props : `ui`, `session`, `activeStudentId` (id résolu, comme pour l'ancien picker : un id qui ne désigne plus d'étudiant ne surligne rien), `disabled`, `onSelect(studentId)`, `onAdd(names, options) => Promise<boolean>`, `actionsSlot?: ReactNode`.

Dans l'ordre : le bouton « Ajouter un étudiant » (ouvre le dialogue), la liste `<ul aria-label="Étudiants de la session">` triée par `order`, puis un pied `actionsSlot`, rendu vide pour l'instant (F15 et F16 y ajoutent leurs boutons).

### `StudentRow`

`<li><button type="button" aria-current={actif ? 'true' : undefined} disabled={disabled}>`, sur deux lignes :
1. « Nom Prénom », pastille de statut (libellé `STATUS_KEY`), et l'icône Tabler `IconDeviceDesktop` si l'étudiant est projeté (`projection.mode === 'student' && projection.studentId === student.id`), avec un libellé accessible « Projeté ».
2. Note brute, puis note finale (`formatScore(..., 'final', ...)`), « — » (`score_not_computed`) si elle vaut `null` ; si l'étudiant est absent, `config.absent.label` à la place des deux notes.

L'étudiant actif est surligné (fond `accent`, bordure `primary`). Un clic sur l'étudiant déjà actif ne déclenche aucune écriture (garde dans l'onglet en plus de la transition).

### `AddStudentDialog`

`Dialog` shadcn, deux `Input` avec leurs `Label` (nom, prénom).
- « Ajouter » et « Ajouter et faire passer » restent désactivés tant qu'un champ trimé est vide ou pendant `disabled`.
- Avertissement de doublon sous les champs, en `role="status"` : « Durand Alice est déjà dans la liste. » (nom et prénom de l'étudiant existant). Il ne bloque rien.
- Après une écriture réussie (`onAdd` renvoie `true`), le dialogue se ferme et ses champs sont vidés. En cas d'échec, il reste ouvert et l'erreur s'affiche par le `role="alert"` existant de `ExaminerView`.

### `ExaminerView`, `PassageHeader`, `SidePanel`

`ExaminerView` construit `studentsTab` comme `studentTab` et le passe à `SidePanel`. `PassageHeader` perd la prop `picker` (il garde le bouton de mode de couleur). `student-picker.tsx` est supprimé.

## Erreurs et cas limites

- **Changer d'étudiant pendant une question `pending`** : autorisé, rien n'est perdu. Le commentaire en cours de saisie est flushé au démontage de `CommentField` (clé par étudiant, F12).
- **`activeStudentId` qui ne désigne plus aucun étudiant** : aucune ligne surlignée, le corps affiche « Aucun étudiant sélectionné » comme aujourd'hui.
- **Double clic sur « Ajouter »** : le second clic est ignoré par le verrou de `run`.
- **Nom vide contourné** : `student_name_required` affiché par `passageErrorMessage`.

## Tests

- **Domaine** :
  - `addStudent` : ajout en fin de liste, `order` = max + 1 même avec des `order` non contigus, 0 sur une liste vide ; `addedDuringSession` et champs par défaut ; trim ; refus d'un champ vide ; `activate` vrai ou faux ; `projection` intacte ; entrée non modifiée.
  - `setActiveStudent` : `projection` intacte ; renvoie la même référence si l'étudiant est déjà actif.
  - `findDuplicate` : casse, accents, espaces ; aucun résultat si un champ est vide.
  - `rosterScore` : les quatre statuts, avec et sans ajustement.
  - `identityKey` : les tests de doublons de `parse-csv` restent verts.
- **Composants** (Testing Library, fake-indexeddb, comme F12) :
  - liste dans l'ordre `order`, étudiant actif en `aria-current`, icône sur l'étudiant projeté ;
  - un clic change l'étudiant actif sans changer `projection` ;
  - aller-retour A → B → A avec une question `pending` sur A, retrouvée intacte ;
  - colonne de note : brute toujours ; finale, « — » ou libellé d'absence selon le statut ;
  - dialogue : boutons désactivés sur champ vide, avertissement de doublon, « Ajouter » laisse l'étudiant actif inchangé, « Ajouter et faire passer » ouvre le passage du nouvel étudiant ;
  - le panneau reste sur l'onglet « Étudiants » après un clic.
- **Réécriture** : les tests qui passaient par le `<select>` de l'en-tête (`passage-example.test.tsx`, `examiner-view`, `passage-header`) passent par l'onglet.

## Critères d'acceptation

- Basculer d'un étudiant à un autre puis revenir restitue exactement l'état du premier.
- Cliquer sur un étudiant ne modifie jamais la vue projetée.
- « Ajouter et faire passer » ouvre directement le passage du nouvel étudiant.
- Le sélecteur provisoire de l'en-tête a disparu.

## Hors périmètre

- Boutons « Statistiques » (F15) et « Exporter en Excel » (F16) : seul leur emplacement est posé.
- Projection et bouton « Projeter cet étudiant » (F14).
- Suppression d'étudiant (l'absence couvre le cas), réordonnancement de la liste.
