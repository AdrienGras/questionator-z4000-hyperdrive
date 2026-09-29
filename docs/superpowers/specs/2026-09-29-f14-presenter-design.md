# F14 — Mode présentateur — Design

- **Date** : 2026-09-29
- **Ticket** : [#14](https://github.com/AdrienGras/questionator-z4000-hyperdrive/issues/14)
- **Branche** : `feat/f14-presenter`
- **Statut** : spec validée en conversation, figée ici avant le plan d'implémentation.

## Contexte

La route `#/present/$sessionId` existe depuis F07 : un écran d'attente thémé, alimenté par `usePresentedConfig`, qui ne sort que la config (D60). Le modèle porte déjà `session.projection` (`{ mode: 'waiting' | 'student'; studentId? }`), `Student.finalRevealedAt` (F11, D31) et `config.presentation` (`showCumulativeScore`, `finalScoreDisplay`, `showStatsOnFinal`, `drawAnimation`, `defaultColorMode`). F13 marque déjà l'étudiant projeté dans la liste. La synchronisation entre fenêtres par `liveQuery` a été vérifiée à la main en F04 ; D23 et D33 en reportent l'automatisation ici, avec Playwright.

## Objectif

Une fenêtre projetée en lecture seule, pilotée depuis la vue examinateur, synchronisée sans action, étanche par construction ; le premier test Playwright à deux fenêtres, dans un job CI `e2e` qui bloque la mise en ligne.

## Décisions (D69)

- **Une seule spec et une seule PR** (une PR par ticket) ; Playwright et la CI arrivent en fin de plan.
- **`toProjectedView` dans `src/domain/presentation/`**, et non `src/present/` comme l'écrit le ticket : D59 range les règles métier pures dans `domain/` (même correction que D64 pour `src/passage/`).
- **Étudiant projeté absent ou introuvable → écran d'attente.** On n'affiche pas une absence devant la salle ; un identifiant orphelin (backup restauré) ne devient pas un cas d'erreur.
- **Animation décidée dans la fenêtre projetée** : le `drawnAt` présent au montage est retenu, seul un `drawnAt` nouveau reçu ensuite anime. Rien n'est écrit en base (la vue reste en lecture seule, D30), pas de second canal de synchronisation.
- **`ProjectedView` construite par liste blanche** : chaque champ est copié explicitement, jamais par étalement d'un objet de la config ou de l'étudiant ; un champ ajouté plus tard au modèle ne fuit pas par défaut.
- **Tests e2e en Page Object Model** : un objet par écran, actions et locators par rôle accessible, assertions dans les specs seulement.

## Architecture

| Fichier | Rôle |
|---|---|
| `src/domain/presentation/projected-view.ts` | type `ProjectedView`, `toProjectedView(session)` |
| `src/domain/passage/projection.ts` | transition `setProjection` |
| `src/components/session-appearance.tsx` | prop `config` élargie au type `AppearanceConfig` |
| `src/features/present/hooks/use-projected-view.ts` | remplace `use-presented-config.ts` |
| `src/features/present/present-page.tsx` | aiguillage `waiting` / `student` |
| `src/features/present/components/waiting-screen.tsx` | inchangé |
| `src/features/present/components/student-screen.tsx` | écran étudiant |
| `src/features/present/components/category-tiles.tsx` | grille en lecture seule |
| `src/features/present/components/draw-reveal.tsx` | animation de tirage |
| `src/features/present/components/final-card.tsx` | note finale et détail |
| `src/features/present/components/present-controls.tsx` | plein écran, bascule de mode |
| `src/features/present/hooks/use-idle.ts` | inactivité (masquage des commandes et du curseur) |
| `src/features/session/components/projection-controls.tsx` | trois boutons de pilotage |
| `src/features/session/components/projection-banner.tsx` | bandeau « la vue projetée montre… » |
| `src/features/session/hooks/use-passage-actions.ts` | action `project` |
| `e2e/`, `playwright.config.ts`, `.github/workflows/ci.yml` | Playwright et job `e2e` |

## Domaine

### `ProjectedView`

```ts
type ProjectedAppearance = {
  locale: NormalizedConfig['locale']
  theme: NormalizedConfig['theme']
  presentation: { defaultColorMode: NormalizedConfig['presentation']['defaultColorMode'] }
}

type ProjectedView =
  | { mode: 'waiting'; examTitle: string; appearance: ProjectedAppearance }
  | {
      mode: 'student'
      examTitle: string
      appearance: ProjectedAppearance
      student: { firstName: string; lastName: string }
      categories: {
        id: string
        label: string
        maxPoints: number
        color?: string
        icon?: string
        exhausted: boolean
        disabled: boolean
      }[]
      current?: { categoryId: string; prompt: string; drawnAt: string }
      questionIndex: { current: number; total: number }
      cumulativeRaw?: number
      final?: { raw?: number; final?: number; scale: number }
      finished: boolean
      detail?: {
        categoryLabel: string
        title: string
        points?: number
        maxPoints: number
        skipped: boolean
      }[]
    }
```

Les nombres sont des décimaux (points), pas des millièmes : la conversion `Milli` → nombre se fait dans `toProjectedView`, pour que les composants se contentent de formater.

### `toProjectedView(session): ProjectedView`

- `mode: 'waiting'` si `projection.mode === 'waiting'`, si `projection.studentId` ne désigne aucun étudiant, ou si l'étudiant projeté est absent. Seuls `examTitle` et `appearance` sont renseignés.
- Sinon `mode: 'student'` :
  - `categories` dans l'ordre de la config ; `maxPoints` = max du barème ; `exhausted` via `isCategoryExhausted` ; `disabled` vrai si une question est en cours (`currentPending`) ou si l'étudiant est terminé ; `color` et `icon` seulement s'ils existent.
  - `current` : la question `pending`, réduite à `categoryId`, `prompt` (énoncé seul) et `drawnAt`.
  - `questionIndex` via `questionIndex`.
  - `cumulativeRaw` seulement si `showCumulativeScore`.
  - `finished` = statut `done`.
  - `final` seulement si `finished` **et** `finalRevealedAt` renseigné : `raw` si `finalScoreDisplay` vaut `raw` ou `both`, `final` (note finale ajustement compris, D31) si `converted` ou `both`, `scale` = `finalScale`. Si la note finale n'est pas calculable (`null`), `final.final` est omis.
  - `detail` seulement si `showStatsOnFinal` et `finished` : une entrée par attempt `scored` ou `skipped`, dans l'ordre du tirage, `points` omis pour une passe.
- Jamais : `answer`, `tags`, commentaire, montant ou justification d'ajustement, motif de passe, `editedAt`, identifiants d'étudiants, données d'un autre étudiant.

### `setProjection(session, projection): Session`

- `{ mode: 'waiting' }` ou `{ mode: 'student'; studentId }` ; lève `PassageError('student_not_found')` si l'étudiant n'existe pas (via `requireStudent`).
- Renvoie la session reçue si la projection demandée est déjà en place (D67) ; ne modifie rien d'autre.

### `SessionAppearance`

La prop `config` prend le type `AppearanceConfig` (`locale`, `theme`, `presentation.defaultColorMode`), que `NormalizedConfig` et `ProjectedAppearance` satisfont tous deux : la vue examinateur ne change pas, la vue projetée n'a pas besoin de la config.

## Fenêtre projetée — `src/features/present/`

- `useProjectedView(sessionId)` : `useSession` puis `toProjectedView` ; renvoie `undefined` (chargement), `null` (session introuvable) ou la `ProjectedView`. Aucun composant de la route ne reçoit la `Session`.
- `PresentPage` : bannière d'état de la base comme aujourd'hui, `SessionFallback` pour chargement et introuvable, puis `SessionAppearance` (`view="present"`) et `WaitingScreen` ou `StudentScreen`. `PresentControls` est rendu dans les deux modes.
- `StudentScreen` : nom de l'étudiant ; `CategoryTiles` ; si `current`, `DrawReveal` autour de l'énoncé (`Markdown` en taille `projection`) ; « 2 / 3 » ; score cumulé si présent ; si `finished` : « Passage terminé » tant que `final` est absent, sinon `FinalCard` (note(s) sur l'échelle, et le détail si présent).
- `CategoryTiles` : des `<div>` (rien de focusable ni de cliquable), couleur et icône de la catégorie, état « épuisée » et « indisponible » visibles.
- `DrawReveal` : un `useRef` retient le `drawnAt` présent au premier rendu. Un `drawnAt` différent reçu ensuite déclenche l'animation, si `drawAnimation` est vrai : trois cartes face cachée aux couleurs de la catégorie, sans texte, se mélangent en CSS (~1,5 s), puis l'une se retourne sur l'énoncé. Avec `prefers-reduced-motion` (lu par `matchMedia`), un fondu court remplace le mélange. `drawAnimation` faux, ou premier rendu : l'énoncé s'affiche directement.
- `PresentControls` : bouton plein écran (`document.documentElement.requestFullscreen()` au clic, masqué si l'API manque ; libellé « Quitter le plein écran » quand `document.fullscreenElement` est posé) et `ColorModeToggle`. `useIdle(3000)` : vrai après 3 s sans `mousemove`, `keydown` ni `pointerdown` ; les commandes passent alors en `opacity-0` et la page en `cursor-none`, un mouvement les fait revenir.
- Réouverture : tout est relu depuis la base au montage, rien n'est gardé en local ; fermer puis rouvrir restitue l'état exact, sans rejouer l'animation.

## Pilotage — `src/features/session/`

- `ProjectionControls` dans `PassageHeader`, à côté de la bascule de mode :
  - « Ouvrir la vue projetée » : un `useRef<Window | null>` garde la fenêtre ; si elle existe et n'est pas `closed`, `focus()` ; sinon `window.open(<url absolue de #/present/<id>>, 'questionator-present')`. Pas de second `window.open` sur une fenêtre ouverte (il la rechargerait).
  - « Projeter cet étudiant » : `project({ mode: 'student', studentId })` ; désactivé sans étudiant actif ou si l'étudiant actif est déjà projeté.
  - « Écran d'attente » : `project({ mode: 'waiting' })` ; désactivé si la projection est déjà en attente.
- `usePassageActions.project(projection)` passe par `run`.
- `ProjectionBanner` sous l'en-tête, en `role="status"`, si `projection.mode === 'student'` et que l'étudiant projeté existe et diffère de l'étudiant actif : « La vue projetée montre Martin Bruno. »
- Libellés fr et en dans `ui-messages`.

## Playwright — `e2e/` (D33)

- `@playwright/test` en devDependency. `playwright.config.ts` : Chromium seul, `testDir: 'e2e'`, `webServer` = `pnpm build && pnpm preview --port 4173 --strictPort`, `baseURL` = `http://localhost:4173/questionator-z4000-hyperdrive/`, `reuseExistingServer` hors CI. Script `pnpm e2e`.
- Vitest exclut `e2e/` ; un `tsconfig.e2e.json` garde les specs dans le typecheck ; prettier et oxlint les couvrent.
- **Page Object Model** :

```
e2e/
  pages/
    home-page.ts            # goto(), createSession() → CreateSessionPage
    create-session-page.ts  # uploadStudents(path), uploadConfig(path), fillName(name), submit() → ExaminerPage
    examiner-page.ts        # draw(category), score(value), setComment(text), openPresentView() → PresentPage,
                            # projectActiveStudent(), showWaiting(), banner
    present-page.ts         # prompt, questionIndex, waitingMessage, text()
  fixtures.ts               # test.extend : { examiner } sur une session d'exemple fraîche
  present.spec.ts
```

  - Un objet par écran, construit sur une `Page` ; une action qui mène à un autre écran renvoie l'objet de cet écran. `openPresentView()` capture la popup (`waitForEvent('popup')`) et renvoie un `PresentPage`.
  - Les pages exposent des actions et des locators, jamais d'`expect`.
  - Locators par rôle et nom accessible (`getByRole`, `getByLabel`), pas de sélecteur CSS ni de `data-testid` : un élément inatteignable ainsi est un défaut d'accessibilité à corriger dans l'application.
  - `fixtures.ts` : contexte de navigateur neuf par test (IndexedDB vide), session créée à partir de `examples/students.example.csv` et `examples/config.example.json`.
- **Scénario `present.spec.ts`** :
  1. ouvrir la vue projetée : écran d'attente ;
  2. « Projeter cet étudiant » : le nom de l'étudiant apparaît dans la popup ;
  3. tirer une question : son énoncé apparaît dans la popup, sans action ;
  4. la noter : « 2 / 3 » apparaît dans la popup ;
  5. saisir un commentaire ;
  6. aucun texte d'`answer` de `examples/config.example.json` (lu par le test), ni le commentaire, n'apparaît dans le texte de la popup ;
  7. fermer la popup, la rouvrir : même état (nom, « 2 / 3 »).
- **CI** : job `e2e` dans `ci.yml` (checkout, pnpm, node, install, cache de `~/.cache/ms-playwright` avec la version de Playwright en clé, `pnpm exec playwright install --with-deps chromium`, `pnpm e2e`, rapport HTML en artefact en cas d'échec). `deploy` dépend de `check` **et** de `e2e`.
- Faire du job `e2e` un contrôle obligatoire des PR est un réglage de protection de branche GitHub, laissé au propriétaire du dépôt.

## Erreurs et cas limites

- **Popup bloquée** (`window.open` renvoie `null`) : message dans la vue examinateur par le `role="alert"` existant (« Autorisez les fenêtres pop-up pour ce site »).
- **Session supprimée pendant que la vue est ouverte** : `SessionFallback` « introuvable ».
- **Étudiant projeté réinitialisé** (F11) : la vue repasse à « 1 / 3 », sans animation tant qu'aucun nouveau tirage n'arrive.
- **Passe** : la question en cours disparaît de la vue ; aucun motif n'est affiché.
- **Correction de note après révélation** : la note affichée se met à jour sans être masquée (PRODUCT F14).

## Tests

- **Domaine** :
  - `toProjectedView` : `waiting` (seul le titre, l'apparence) ; étudiant absent ou introuvable → `waiting` ; chaque réglage `presentation.*` ; `disabled` et `exhausted` ; `final` absent avant `finalRevealedAt` ; `finalScoreDisplay` `raw` / `converted` / `both` ; note finale ajustement compris ; `detail` avec une passe sans `points`.
  - Test de fuite : une session dont l'`answer`, les `tags`, le commentaire, la justification d'ajustement, le motif de passe et le nom d'un autre étudiant sont des marqueurs uniques ; aucun n'apparaît dans `JSON.stringify(toProjectedView(session))`, dans aucun mode.
  - `setProjection` : les deux modes, `student_not_found`, même référence si inchangé.
- **Vue projetée** (Testing Library, `ProjectedView` fabriquées) : chaque mode ; animation sur nouveau `drawnAt` et pas au montage ; fondu avec reduced motion (`matchMedia` simulé) ; pas d'animation si `drawAnimation` faux ; commandes masquées après 3 s (faux timers) et revenues au mouvement.
- **Pilotage** (fake-indexeddb) : chaque bouton écrit la projection attendue et se désactive quand il le doit ; `window.open` simulé, second clic → `focus()` sans rouvrir, popup bloquée → message ; bandeau selon l'étudiant actif.
- **e2e** : le scénario ci-dessus.

## Critères d'acceptation

- Aucun élément de réponse, note d'un autre étudiant, commentaire ni ajustement n'apparaît dans la vue projetée.
- Un tirage ou une note dans la vue examinateur apparaît dans la vue projetée sans action supplémentaire.
- La note finale n'apparaît qu'à la fermeture de la popup d'ajustement.
- Fermer puis rouvrir la vue projetée restitue exactement son état.
- Le job CI `e2e` passe et bloque la mise en ligne en cas d'échec.

## Hors périmètre

- Hors ligne (F17, qui réutilisera Playwright et ses pages).
- Test Playwright de l'animation et du plein écran (couverts en Vitest ; le plein écran exige un geste utilisateur réel).
- Protection de branche GitHub.
