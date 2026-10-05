# F43.3 — Mise en place, écran d'entraînement et accueil — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Un étudiant ouvre l'application, suit les 4 étapes, dépose ou colle la config produite par son LLM, s'entraîne sans fin (tirage → énoncé → réponse → auto-notation ou passage) et retrouve son entraînement depuis l'accueil.

**Architecture:** Trois features sans import croisé : `training-setup` (`/training/new`), `training` (`/training/$trainingId`), et l'accueil existant (`home`) qui gagne une section. Tout ce qui est partagé avec la création de session ou la vue examinateur remonte d'abord dans `src/components/` ou `src/hooks/`, dans un commit de refactor sans changement de comportement. Les écritures passent par `src/lib/db/trainings.ts` (#135) via un hook `useTrainingActions` calqué sur `usePassageActions`.

**Tech Stack:** React 19, TanStack Router (auto code splitting), Dexie (`useLiveQuery`), shadcn/ui, Tailwind 4, Vitest + Testing Library, Playwright (Page Object Model).

**Spec:** `docs/superpowers/specs/2026-10-05-f43-entrainement-autonome-design.md` (§ « Parcours et écrans »). Ticket : #136. Branche : `feat/136-ecrans-entrainement` (créée depuis `main` après le merge de #139).

## Décisions validées avec l'utilisateur (2026-10-05)

- **Accueil** : une 4e carte d'action « S'entraîner » à gauche ; à droite, une section « Mes entraînements » **au-dessus** des sessions, masquée s'il n'y a aucun entraînement.
- **Écran d'entraînement** : une colonne. Les tuiles occupent l'écran ; au tirage, la question les remplace (énoncé, « Voir la réponse », « Passer ») ; après révélation, la réponse et les boutons du barème ; après la note ou le passage, retour aux tuiles.
- **Hors périmètre de ce ticket** (#137) : écran de stats, « Mettre à jour la config » (`?replace=`), lien « Stats ».

## Global Constraints

- D59 : routes minces ; `features/<x>/<x>-page.tsx` seul importé par la route ; jamais d'import entre features ; partagé → `components/`, `hooks/`, `lib/`, `domain/`. `pnpm deps` passe sans toucher aux règles.
- Bundle initial (`scripts/check-initial-bundle.ts`) : l'accueil ne doit importer statiquement ni `@/domain/config/validate`, ni `code-languages`, ni Markdown/Shiki, ni CodeMirror. Le validateur reste derrière un `import()` (comme `loadValidator`). `CategoryIcon` garde son import profond. Après chaque tâche qui touche une route : `rtk pnpm build && rtk pnpm check:bundle && rtk pnpm check:budget`.
- i18n : toutes les chaînes dans `src/lib/i18n/ui-messages.ts` (type `UiMessageParams`, dictionnaires `fr` et `en`, **et** l'entrée `SAMPLE` de `ui-messages.test.ts`). Préfixes : `training_setup_*`, `training_*`, `home_training_*`. Vouvoiement, phrases courtes, comme le reste de l'interface.
- Accessibilité : rôles et noms explicites (les e2e ciblent `getByRole`), `role="alert"` pour les erreurs, focus déplacé sur le titre de la question au tirage et sur la réponse à la révélation.
- Erreurs d'écriture affichées en ligne (`<p role="alert">`), jamais en toast : `TrainingError` → `trainingErrorMessage(error, locale)` ; autre → message générique (`passage_error_generic` existe déjà).
- Hasard : `cryptoRandomInt` (`@/domain/passage/random`) ; horloge `() => new Date()`.
- Commits gitmoji, au présent, en français, avec en trailer :
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` puis `Claude-Session: https://claude.ai/code/session_01Xy2DSgKQywYQtqqvZuaMFw` (ces lignes exactes, quel que soit le modèle qui exécute).
- `rtk` en préfixe ; si `rtk vitest run` avale la sortie : `rtk proxy pnpm exec vitest run <chemin>`. Ne jamais lire un `docs/*.md` en entier.

## Review Focus

1. **Double clic sur une tuile ou sur une note** : une seule écriture part (garde `inFlight` comme `usePassageActions`) ; aucune erreur `pending_exists` fantôme pendant que la requête live rattrape l'écriture (tâche 4).
2. **Rechargement pendant une question** : la question en attente est restaurée, réponse **masquée** (l'état « révélée » n'est pas persisté) (tâches 4 et 6).
3. **JSON collé invalide ou vide** : erreurs listées avec leur chemin, bouton « C'est parti » désactivé ; un JSON non parsable donne l'issue de parsing existante, pas une exception (tâche 3).
4. **Copie du prompt impossible** (contexte non sécurisé, refus) : message d'échec et le texte reste sélectionnable à la main (tâches 2 et 3).
5. **Entraînement absent, endommagé, base `outdated`/`unavailable`** : écran dédié, jamais de plantage (tâches 4 et 5).

---

### Task 1: Remonter les briques partagées (refactor sans changement de comportement)

**Files:**
- Move: `src/features/create-session/components/file-drop-field.tsx` (+ test) → `src/components/file-drop-field.tsx`
- Create: `src/components/config-issue-list.tsx` (la liste d'issues extraite de `config-preview.tsx` : erreurs d'abord, chemin en `<code>`, message `formatConfigIssue`, icône d'avertissement) ; `config-preview.tsx` l'utilise
- Create: `src/hooks/use-config-slot.ts` (la moitié config de `use-create-form.ts` : état `FileSlot<ValidationResult>`, `setConfigFile(file)`, `setConfigText(text, fileName)`, validateur chargé à la demande, garde de séquence) ; `use-create-form.ts` l'utilise. `configSlotStatus` (`slot-status.ts`) suit dans `src/hooks/` ou `src/components/` selon qui l'importe.
- Create: `src/components/scale-buttons.tsx` (`ScaleButtons({ ui, config, scale, disabled, onScore(value) })` : un bouton par valeur, `formatScore(toMilli(v), 'raw', config, locale)`, `aria-label` `passage_score_button`) ; `question-panel.tsx` l'utilise
- Create: `src/components/category-tile.tsx` (contenu d'une tuile : icône, libellé, points max, accent `--category-color`) ; `category-grid.tsx` l'utilise
- Tests : déplacer les tests existants avec leurs fichiers ; aucun test existant ne change d'assertion.

**Interfaces:**
- Produces: `FileDropField` (props inchangées), `ConfigIssueList({ ui, issues: ConfigIssue[] })`, `useConfigSlot(): { slot; setConfigFile; setConfigText }`, `ScaleButtons`, `CategoryTile({ ui, config, category })`.

- [ ] **Step 1:** Déplacer et extraire, imports mis à jour.
- [ ] **Step 2:** `rtk vitest run src/features/create-session src/features/session src/components src/hooks` → PASS sans modifier une assertion ; `rtk pnpm deps` → OK.
- [ ] **Step 3: Commit** `♻️ Remonte les briques de config et de tuiles partagées`

---

### Task 2: Copie dans le presse-papiers et passage vers l'éditeur

**Files:**
- Create: `src/lib/clipboard.ts` — `copyText(text: string): Promise<boolean>` (`navigator.clipboard.writeText`, `false` si l'API manque ou rejette ; ne lève jamais). Test : `clipboard.test.ts` (succès, API absente, rejet).
- Modify: `src/lib/config-handoff.ts` — ajouter `stashConfigForEditor(handoff)` / `takeConfigForEditor()` sur une seconde clé `questionator:editor-handoff`, même forme que le couple existant. Tests à côté des existants.
- Modify: `src/features/config-editor/hooks/use-config-draft.ts` — au montage, une config déposée pour l'éditeur **prime** sur le brouillon (et devient le nouveau brouillon). Test : dépôt présent → `initialText` = texte déposé ; absent → comportement actuel.

- [ ] **Step 1:** Tests qui échouent. **Step 2:** FAIL. **Step 3:** Implémenter. **Step 4:** PASS.
- [ ] **Step 5: Commit** `✨ Ajoute la copie dans le presse-papiers et le passage d'une config vers l'éditeur`

---

### Task 3: Écran de mise en place (`/training/new`)

**Files:**
- Create: `src/routes/training.new.tsx` (route mince → `TrainingSetupPage`)
- Create: `src/features/training-setup/training-setup-page.tsx`, `components/setup-step.tsx` (étape numérotée : pastille, titre, contenu), `components/prompt-step.tsx`, `components/config-step.tsx`, `hooks/use-training-setup.ts`
- Modify: `src/lib/i18n/ui-messages.ts` (+ `SAMPLE`)
- Test: `training-setup-page.test.tsx`, `hooks/use-training-setup.test.ts`

**Contenu (fr de référence)** :
- Titre de page « S'entraîner », lien retour vers l'accueil.
- Étape 1 « Rassemblez votre cours » : « Réunissez le cours et les ateliers dans un seul PDF ou une seule archive zip. Ce fichier reste chez vous : vous le donnerez au LLM, pas à l'application. »
- Étape 2 « Copiez le prompt » : `<textarea readOnly>` contenant `buildTrainingPrompt(locale)` (hauteur limitée, défilement), bouton « Copier le prompt » → `copyText` ; succès « Prompt copié. » (live region) ; échec « La copie a échoué : sélectionnez le texte et copiez-le à la main. » (`role="alert"`). Phrase d'aide : « Collez-le dans un LLM qui a accès au web, avec votre fichier de cours. »
- Étape 3 « Récupérez la config » : « Le LLM vous rend un fichier .json, ou un bloc de code JSON. »
- Étape 4 « Déposez-la » : `FileDropField` (accept `.json,application/json`) **et** un `<textarea>` « … ou collez le JSON ici » (bouton « Vérifier le JSON collé » qui appelle `setConfigText(text, 'config-collee.json')`). Sous le champ : statut (`ConfigIssueList` si erreurs/avertissements ; si valide, résumé : titre de l'examen et nombre de questions par catégorie). Si erreurs : bouton « Corriger dans l'éditeur » → `stashConfigForEditor({ text, fileName })` puis navigation `/editor`. Bouton principal « C'est parti » désactivé tant que la config n'est pas valide ou que la base n'est pas `open`.
- Soumission : `newTraining(config, { newId: () => crypto.randomUUID(), now })` → `createTraining` → navigation `/training/$trainingId` (même garde « toujours sur la page » que `CreateSessionPage`). Échec → `<p role="alert">` `create_write_error`.
- Garde de dépôt de fichier au niveau de la page (`hasFiles`, comme `CreateSessionPage`). `DbStatusBanner` si la base n'est pas `open`.

- [ ] **Step 1: Tests qui échouent** : les 4 étapes s'affichent avec leurs titres ; le prompt affiché égale `buildTrainingPrompt('fr')` ; « Copier » appelle `copyText` et annonce le succès, puis l'échec quand il renvoie `false` ; un fichier valide active « C'est parti » et affiche le résumé ; un JSON collé invalide liste ses erreurs et affiche « Corriger dans l'éditeur » (qui appelle `stashConfigForEditor`) ; un clic sur « C'est parti » crée l'entraînement en base et navigue ; base `outdated` → bannière et bouton désactivé.
- [ ] **Step 2:** FAIL. **Step 3:** Implémenter. **Step 4:** PASS ; `rtk pnpm build && rtk pnpm check:bundle && rtk pnpm check:budget`.
- [ ] **Step 5: Commit** `✨ Ajoute l'écran de mise en place d'un entraînement`

---

### Task 4: Écran d'entraînement (`/training/$trainingId`)

**Files:**
- Create: `src/routes/training.$trainingId.tsx`
- Create: `src/features/training/training-page.tsx`, `components/training-tiles.tsx` (`CategoryLayout` + `CategoryTile`, jamais grisées), `components/training-question.tsx` (énoncé, révélation, `ScaleButtons`, « Passer »), `components/damaged-training-screen.tsx` (titre, issues via `ConfigIssueList`, lien accueil), `hooks/use-training-actions.ts`
- Modify: `src/components/session-fallback.tsx` — prop facultative `messages?: { loading: string; notFound: string }` (défaut : textes actuels) ; test ajouté.
- Modify: `ui-messages.ts` (+ `SAMPLE`)
- Test: `training-page.test.tsx`, `hooks/use-training-actions.test.ts`, `components/*.test.tsx`

**Interfaces:**
- `useTrainingActions(trainingId: string, drawsCount: number | undefined): { draw(categoryId): Promise<void>; score(drawId, points): Promise<void>; pass(drawId): Promise<void>; busy: boolean; error: Error | null }` — garde `inFlight` (un seul appel à la fois, les suivants ignorés) ; `busy` reste vrai tant que `drawsCount` n'a pas rattrapé l'écriture (même idée que `lastWritten` de `usePassageActions`, sur le nombre de tirages ou leur dernier état) ; l'erreur est conservée jusqu'à l'action suivante.

**Comportement :**
- `useTraining(id)` : `undefined` → `SessionFallback kind="loading"` (textes `training_*`) ; `null` → `kind="not-found"` ; endommagé → `DamagedTrainingScreen`. `DbStatusBanner` si la base n'est pas `open`.
- Apparence : `SessionAppearance sessionId={\`training-${id}\`} view="examiner" config={training.config}` (clé de mode couleur distincte des sessions). Titre de page = `training.name`, lien retour vers l'accueil.
- Sans tirage en attente : tuiles. Avec un tirage `pending` (`currentPending(draws)`) : `TrainingQuestion` (catégorie et titre, `Markdown` de l'énoncé, « Voir la réponse » puis `Markdown` de `answer` — ou « Pas de réponse de référence pour cette question. » si absente — puis `ScaleButtons`). « Passer » visible avant et après la révélation. L'état « révélée » est local (`useState`, réinitialisé par `key={draw.id}`), donc masqué après rechargement.
- `presentation.drawAnimation` : vrai → l'arrivée de la question utilise une transition d'apparition courte (`motion-safe:animate-in motion-safe:fade-in`, tw-animate-css est déjà chargé) ; faux → aucune ; toujours neutralisée par `prefers-reduced-motion`.
- Focus : au tirage, sur le titre de la question ; à la révélation, sur le titre « Réponse » ; au retour aux tuiles, sur le titre de la grille.

- [ ] **Step 1: Tests qui échouent** (`fake-indexeddb`, données semées avec `createTraining`) : chargement puis tuiles ; tirer → question affichée, réponse masquée ; « Voir la réponse » → réponse + barème ; noter → retour aux tuiles et tirage `scored` en base ; « Passer » avant révélation → `passed` ; question en attente semée → affichée au montage, réponse masquée ; double clic rapide sur une tuile → un seul tirage en base ; `TrainingError` simulée → message localisé en `role="alert"` ; id absent → écran « introuvable » ; entraînement endommagé → écran dédié avec ses issues ; `drawAnimation: false` → pas de classe d'animation.
- [ ] **Step 2:** FAIL. **Step 3:** Implémenter. **Step 4:** PASS ; build + `check:bundle` + `check:budget`.
- [ ] **Step 5: Commit** `✨ Ajoute l'écran d'entraînement`

---

### Task 5: Accueil — carte « S'entraîner » et « Mes entraînements »

**Files:**
- Modify: `src/features/home/components/action-cards.tsx` (4e carte, icône Tabler statique `IconSchool`, titre « S'entraîner », texte « Révisez seul à partir d'une config générée par un LLM. », lien « Commencer » → `/training/new` ; masquée si le stockage est indisponible, comme « Créer une session »)
- Create: `src/features/home/components/training-list.tsx`, `training-card.tsx`, `damaged-training-card.tsx`, `delete-training-dialog.tsx`
- Modify: `src/features/home/home-page.tsx` (section `aria-labelledby="home-trainings-title"`, titre visible « Mes entraînements », au-dessus de la section des sessions, rendue seulement si `useTrainings()` renvoie une liste non vide)
- Modify: `ui-messages.ts` (+ `SAMPLE`)
- Test: un test par composant + `home-page.test.tsx` (ajouts)

**Contenu :**
- `TrainingCard` : nom (`h3`, `wrap-anywhere`), « Dernière activité : <date> » (`formatDateTime`), « <n> % des questions vues » (couverture via `computeTrainingStats(config, draws).coverage`, draws lus par `useTrainingDraws(id)` dans la carte), lien principal « Reprendre » → `/training/$trainingId`, menu d'actions (`card_actions`) avec « Supprimer ».
- `DeleteTrainingDialog` : confirmation (« Supprimer « <nom> » ? L'historique et les stats de cet entraînement seront perdus. »), appelle `deleteTraining(id)`, erreur en ligne `write_error`, Annuler/Échap bloqués pendant la suppression (comme `DeleteDialog`).
- `DamagedTrainingCard` : `damagedTrainingName`, pastille `damaged_badge`, menu « Supprimer ».
- Tri : celui de `listTrainings` (dernière activité d'abord).
- Import : aucun import statique du validateur (la couverture passe par `@/domain/training/training-stats`, pur et léger) ; vérifier `check:bundle`.

- [ ] **Step 1: Tests qui échouent** : carte « S'entraîner » et son lien ; section absente sans entraînement ; présente au-dessus des sessions avec un entraînement semé ; carte : nom, couverture (« 25 % » pour 1 question notée sur 4), lien « Reprendre » ; suppression confirmée → entraînement et journal supprimés ; carte endommagée.
- [ ] **Step 2:** FAIL. **Step 3:** Implémenter. **Step 4:** PASS ; build + `check:bundle` + `check:budget`.
- [ ] **Step 5: Commit** `✨ Affiche les entraînements sur l'accueil`

---

### Task 6: Parcours e2e

**Files:**
- Create: `e2e/pages/training-setup-page.ts`, `e2e/pages/training-page.ts` (POM, sélecteurs par rôle et nom, méthodes qui renvoient le POM suivant) ; Modify: `e2e/pages/home-page.ts` (`startTraining()`, `openTraining(name)`)
- Create: `e2e/training.spec.ts`

- [ ] **Step 1: Écrire le parcours** : accueil → « S'entraîner » → coller le contenu de `examples/training.example.json` → « C'est parti » → tirer une catégorie → « Voir la réponse » → noter → tirer → recharger la page (la même question est affichée, réponse masquée) → « Passer » → retour à l'accueil : « Mes entraînements » liste l'entraînement avec sa couverture ; puis une config collée invalide affiche ses erreurs et « Corriger dans l'éditeur » ouvre l'éditeur avec ce texte.
- [ ] **Step 2:** `rtk pnpm e2e e2e/training.spec.ts` → PASS (corriger le code, pas le test, si un comportement de la spec manque).
- [ ] **Step 3: Commit** `✅ Ajoute le parcours e2e de l'entraînement`

---

### Task 7: Guide et mémoire

**Files:**
- Create: `site/guide/s-entrainer.md` (page « S'entraîner seul » : à qui ça sert, les 4 étapes, le prompt et le prérequis « LLM avec accès au web », l'auto-notation avec la grille de `answer`, « Passer », la reprise depuis l'accueil). Ajouter la page à la barre latérale VitePress (`site/.vitepress/config.ts`) et un renvoi depuis `site/guide/prise-en-main.md`. Si `site/guide/depannage.test.ts` ou `reference-config.test.ts` imposent une structure aux pages, la respecter.
- Modify: `docs/INDEX.md` (ligne F43.3, « En revue »), `docs/HANDOFF.md` (entrée datée, 4 marqueurs), `docs/DECISIONS.md` (D101 : lignes « Accueil : section au-dessus des sessions » et « Écran d'entraînement en une colonne », décision utilisateur), `docs/CONVENTIONS.md` si un squelette émerge (`useTrainingActions`), `docs/QUIRKS.md` si un piège est découvert.

- [ ] **Step 1:** Rédiger (lecture des `docs/*.md` par plage uniquement).
- [ ] **Step 2:** `rtk pnpm check && rtk pnpm docs:build` → vert.
- [ ] **Step 3: Commit** `📝 Documente l'entraînement dans le guide et la mémoire (F43.3)`

---

## Après les tâches (session principale)

Essai manuel avec un LLM réel (critère du ticket) : je prépare le prompt et une capture du parcours ; **l'essai avec un vrai LLM est à faire par l'utilisateur**, le résultat est consigné dans la PR. PR brouillon `Closes #136`, `sonar-check.sh --pr <n> --wait`, « Ready for review » une fois le gate OK. Pas de merge sans le go de l'utilisateur.
