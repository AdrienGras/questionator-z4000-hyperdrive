# F44.9 — Entraînement — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/training/new`, `/training/$trainingId/update` et `/training/$trainingId` suivent leurs trois artboards validés (#151) : étapes à état, prompt résumé après copie, zone de dépôt compacte, JSON collé dans un repli, compteurs en pastilles, bilan de mise à jour en cartes ; tuiles verrouillées pendant une question, question en carte teintée, réponse repliable, « Notez-vous · sur 2 ». D'un PDF de cours à une première question tirée, le parcours ne change pas.

**Architecture:** On restyle sur place dans `features/training-setup` et `features/training`. Deux briques partagées gagnent une variante : `FileDropField` (`size="compact"`) et `ScaleButtons` (`variant="row"`, teinte de la catégorie). L'état des étapes est une fonction pure (`step-states.ts`) ; l'état de la copie remonte de `PromptStep` à la page, qui en a besoin pour situer l'étape en cours. Le hook `useTrainingSetup` expose seulement `configReady` en plus. Aucun changement dans `domain/` ni `lib/db/`.

**Tech Stack:** React 19, TanStack Router (routage par hash), Tailwind CSS v4, icônes Tabler, Vitest + Testing Library, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-14-f44-refonte-ui-design.md` (D102), carte des écrans `docs/superpowers/specs/2026-10-17-f44-carte-des-ecrans.md` (§ Entraînement (#151), D103), ticket #151. Maquettes du canevas <https://claude.ai/artifact/DvvtZZb9ie2vknoXtHfnJL>, page « Après » : `entrainement-mise-en-place`, `entrainement-mise-a-jour`, `entrainement-question`. Design system <https://claude.ai/artifact/DMYaQZGYtm8RnJqbBMmBcy>. Lecture des artboards : `Artifact` `read` avec `paths: ["project/apres/<nom>.dc.html"]`, puis extraire `<main>…</main>` et retirer les `<svg>` (HANDOFF F44.6, Notes pour future Claude).

## Global Constraints

- **Canevas avant l'interface (D102)** : les artboards sont validés (D103). Un écart d'implémentation met l'artboard à jour dans la même PR (Task 5). **Le code fait foi pour tout état que la maquette ne montre pas**, restylé avec les briques du design system : tuiles seules avant tout tirage (`TrainingTiles`, inchangé), question disparue de la config, « Voir la réponse » avant révélation, alertes d'erreur (copie, lecture, écriture, refus du journal), liste d'erreurs de config et « Corriger dans l'éditeur », bandeau de base (`DbStatusBanner`), états de `TrainingGate`.
- **Parcours inchangé (critère d'acceptation)** : aucune modification de `buildTrainingPrompt`, du tirage en cycle (`domain/training/`), de `lib/db/trainings.ts` ni des écritures de `useTrainingSetup` / `useTrainingActions`. `e2e/training.spec.ts` reste vert en n'adaptant que ses page objects.
- **Étapes indicatives (D103)** : toutes restent actives. La config peut se déposer ou se coller dès l'arrivée, l'étape 4 montre toujours sa zone de dépôt et son repli de collage. L'état d'une étape ne change que son cadre, jamais ce qui est utilisable.
- **Règle d'état des étapes** : étape en cours = 4 si le prompt a été copié au moins une fois **ou** si l'emplacement de config n'est pas vide (`config.kind !== 'empty'`), sinon 2. Les étapes d'avant sont « faites », celles d'après « à venir ». Même règle en création et en mise à jour.
- **Copie** : `copied` reste vrai après une première copie réussie (le prompt reste résumé) ; `failed` décrit seulement le dernier essai. Un échec affiche l'alerte `training_setup_copy_failed` dans les deux formes de l'étape.
- **Accessibilité** : oxlint refuse `role="img"` et `role="group"`. Pastilles de numéro et traits d'étape `aria-hidden` ; l'état d'une étape est dans son titre (`span sr-only` « (Étape faite) »), `aria-current="step"` sur l'étape en cours. Un bouton dont le libellé visible est court porte le libellé long en `aria-label` qui **commence** par le texte visible (« Vérifier » → « Vérifier le JSON collé »). Une région `aria-live` reste montée d'un rendu à l'autre (un nœud neuf n'est pas annoncé).
- **Couleurs** : uniquement des tokens et `--category-color` (posé par `categoryAccent`). Repli sans couleur : `--color-muted-foreground`. Étape faite : `bg-space-training/16 text-space-training` ; étape en cours : `bg-linear-135 from-primary to-action-to text-primary-foreground` ; « Étape N sur 4 » : `text-link` ; contour de l'étape en cours : `outline outline-1 outline-[color:color-mix(in_oklch,var(--color-primary)_45%,transparent)]` ; ampoule de l'effort : `text-space-editor` (même jaune que l'artboard). Teintes de catégorie écrites en classes complètes avec le type `color:`, `dark:` répété (commentaire de `CATEGORY_TILE_BUTTON_CLASS`, QUIRKS).
- **Typo** : titre d'étape en cours `text-h2`, autres titres d'étape `text-h3` (faite : `text-foreground`, à venir : `text-muted-foreground`) ; surtitres en `text-label uppercase` ; titre de question `text-2xl leading-8 font-bold tracking-tight` (24 px) ; chiffres du bilan `text-score-md tabular-nums`.
- **Libellés** : FR et EN évoluent ensemble. Chaque nouvelle clé entre dans `UiMessageParams`, les deux dictionnaires et `SAMPLE` de `ui-messages.test.ts` ; une clé qui n'est plus lue est supprimée (vérifier par `grep -rn` dans `src/`). Pluriels par `plural` (FR) et `pluralEn` (EN).
- **Arborescence (D59)** : aucun import entre features (`pnpm deps` vert) ; fichiers en kebab-case, imports par `@/`.
- **Tests (D102)** : un test de forme (libellé, structure, rôle) s'adapte, page objects e2e compris (`e2e/pages/training-setup-page.ts`, `training-page.ts`) ; un test de comportement qui casse signale une régression.
- Commits gitmoji en français sur `feat/f44-refonte-ui`, PR #154 toujours en brouillon (D102).

## Review Focus

1. **Copie refusée puis réussie, puis « Copier à nouveau » refusé** : l'alerte apparaît, l'étape 2 reste en cours tant qu'aucune copie n'a réussi ; après succès, le résumé s'affiche, le focus reste sur le bouton (même nœud, devenu « Copier à nouveau ») et « Prompt copié. » est annoncé ; un nouvel échec garde le résumé et montre l'alerte. Tests dans la Task 2.
2. **JSON collé dans le repli fermé** : la zone de collage n'est atteignable qu'après ouverture du repli ; les erreurs de validation et « Corriger dans l'éditeur » s'affichent **hors** du repli, visibles même s'il est refermé. Tests dans la Task 3 (unitaire) et page object dans la Task 5.
3. **Question disparue de la config** (journal plus récent que la config) : carte neutre (sans `--category-color`), aucune tuile verrouillée marquée `aria-current`, message et « Passer » seul. Test dans la Task 4.
4. **« Masquer » la réponse** : la réponse se replie, le libellé devient « Afficher », les boutons « Noter … » et « Passer » restent visibles et actifs ; une question suivante arrive réponse masquée (le composant est remonté par `key`). Tests dans la Task 4.
5. **Téléphone à 390 px, 13 catégories, libellé long** : tuiles verrouillées sur deux colonnes, libellé tronqué ; pastilles de compteurs qui passent à la ligne ; bilan en cartes empilées ; aucun débordement horizontal (mesure élément par élément, `e2e/stats-layout.spec.ts`). Test e2e dans la Task 5.

---

### Task 1: Variantes de `FileDropField` et `ScaleButtons`

**Files:**
- Modify : `src/components/file-drop-field.tsx`, `src/components/scale-buttons.tsx`
- Test : `src/components/file-drop-field.test.tsx`, `src/components/scale-buttons.test.tsx`
- Modify : `src/lib/i18n/ui-messages.ts`, `src/lib/i18n/ui-messages.test.ts`

**Interfaces:**
- Produces :
  - `FileDropField` gagne `size?: 'large' | 'compact'` (défaut `large`, rendu actuel inchangé) et `emptyHint?: string` (lu seulement en `compact`). En `compact` : même `fieldset` / `legend` / `input` caché et même nœud `aria-live` ; la zone devient une rangée `flex flex-wrap items-center gap-3 rounded-md border-[1.5px] px-4 py-3.5` (bordures de `STATUS_BORDERS`, fond `bg-background` une fois un fichier choisi). Vide : icône d'état, `emptyHint` en `flex-1 min-w-0 text-muted-foreground`, bouton `outline sm` « Choisir un fichier ». Rempli : icône d'état, nom du fichier `font-semibold truncate`, texte d'état (`aria-live`) en `text-small`, puis à droite (`ml-auto flex items-center gap-2`) « ou déposez-en un autre » (`create_drop_other`) et « Remplacer ». Le texte d'état reste visible (écart à l'artboard, reporté en Task 5).
  - `ScaleButtons` gagne `variant?: 'grid' | 'row'` (défaut `grid`, rendu actuel inchangé). `row` : conteneur `flex flex-wrap gap-2`, boutons `h-14 min-w-16 px-4 text-lg font-bold tabular-nums`, teinte de la catégorie (`--category-color` posé par un parent) : bordure 40 %, fond 8 % sur `--color-card`, survol 14 %, repli `--color-muted-foreground`. `aria-label` inchangé (« Noter 0,5 »).
  - Clé `create_drop_other: NoParams` : « ou déposez-en un autre » / « or drop another one ».

- [ ] **Step 1: Écrire les tests qui échouent**

`file-drop-field.test.tsx` :
- `compact vide : texte d'invite et « Choisir un fichier », pas d'indication de dépôt du grand format` — `emptyHint="Déposez la config (.json) ici"` visible ; bouton « Choisir un fichier » ; `queryByText('ou déposez-le ici')` absent.
- `compact rempli : nom, état annoncé, « ou déposez-en un autre » et « Remplacer »` — `fileName="revisions.json" status="ok"` : textes « revisions.json », « ou déposez-en un autre », bouton « Remplacer » ; le nœud `aria-live` contient le libellé de `create_file_status_ok`.
- `compact : un dépôt de fichier appelle onFile` — même scénario de dépôt que le test existant du grand format.

`scale-buttons.test.tsx` :
- `row : un bouton par valeur, mêmes noms, rangée qui passe à la ligne` — barème `[0, 0.5, 1, 1.5, 2]` : cinq boutons « Noter 0 » … « Noter 2 » ; leur parent a la classe `flex-wrap`.
- `grid par défaut : rendu inchangé` — le parent a la classe `grid`.

- [ ] **Step 2: Lancer les tests, vérifier qu'ils échouent**

Run: `rtk vitest run src/components/file-drop-field.test.tsx src/components/scale-buttons.test.tsx`
Expected: FAIL (prop `size` et `variant` inconnues, texte « ou déposez-en un autre » absent).

- [ ] **Step 3: Implémenter les deux variantes et la clé `create_drop_other`**

Garder un seul composant par brique : la variante choisit les classes et l'ordre des enfants, pas un second composant exporté.

- [ ] **Step 4: Lancer les tests, vérifier qu'ils passent**

Run: `rtk vitest run src/components/ src/lib/i18n/`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
rtk git add src/components/file-drop-field.tsx src/components/file-drop-field.test.tsx src/components/scale-buttons.tsx src/components/scale-buttons.test.tsx src/lib/i18n/
rtk git commit -m "✨ Ajoute les variantes compacte de la zone de dépôt et en rangée du barème"
```

---

### Task 2: Étapes à état et prompt résumé après copie

**Files:**
- Create : `src/features/training-setup/step-states.ts`, `src/features/training-setup/step-states.test.ts`
- Modify : `src/features/training-setup/components/setup-step.tsx`, `src/features/training-setup/components/prompt-step.tsx`, `src/features/training-setup/training-setup-page.tsx`, `src/features/training-setup/hooks/use-training-setup.ts`
- Test : `src/features/training-setup/training-setup-page.test.tsx`, `src/features/training-setup/hooks/use-training-setup.test.ts`
- Modify : `src/lib/i18n/ui-messages.ts`, `src/lib/i18n/ui-messages.test.ts`

**Interfaces:**
- Consumes : rien des autres tâches.
- Produces :
  - `type StepState = 'done' | 'current' | 'upcoming'` et `setupStepStates({ copied, configChosen }: { copied: boolean; configChosen: boolean }): readonly [StepState, StepState, StepState, StepState]` (règle des Global Constraints).
  - `SetupStep({ number, total, state, title, children }: { number: number; total: number; state: StepState; title: string; children: ReactNode })` : `li` (`aria-labelledby` sur le titre, `aria-current="step"` si `current`), `flex gap-4`. Colonne de gauche `aria-hidden` : pastille `size-8 rounded-full` (faite : `IconCheck size-4.5` ; en cours / à venir : le numéro, `tabular-nums`) et trait `mt-1.5 min-h-4 w-0.5 flex-1 rounded-full bg-border` sauf pour la dernière étape (`number === total`) ; `pt-6` sur la colonne quand l'étape est en cours. Corps : en cours, carte `mb-6 flex min-w-0 flex-1 flex-col gap-4 rounded-lg bg-card p-6 shadow-card` avec le contour primaire, surtitre « Étape N sur 4 » puis titre `h2 text-h2` ; sinon `flex min-w-0 flex-1 flex-col gap-1.5 pt-1 pb-7`, titre `h2 text-h3`. Le titre finit par `<span className="sr-only"> ({training_setup_step_state})</span>`.
  - `type PromptCopy = { copied: boolean; failed: boolean }` (exporté de `prompt-step.tsx`) ; `PromptStep({ ui, prompt, copy, onCopy }: { ui: Ui; prompt: string; copy: PromptCopy; onCopy: () => void })`. Non copié : note d'effort (`role="note"`, `rounded-md bg-muted px-4 py-3.5`, `IconBulb text-space-editor`, titre en `strong`, corps en `text-muted-foreground`), libellé **visible** « Prompt à copier » (`text-small font-semibold`), zone en lecture seule (`font-mono text-xs`, `rows={9}`), indication, puis la rangée de copie. Copié : la rangée de copie (« Prompt copié. » puis bouton `ghost` « Copier à nouveau » en `text-muted-foreground`), puis `details` « Afficher le prompt » qui contient la note, la zone et l'indication. **Le bouton et le `span aria-live` restent les mêmes nœuds** : enfants à emplacements fixes (`[avant | null, rangée, après | null]`), libellé et variante du bouton changent (`default` + `IconCopy` → `ghost`), le texte live passe à « Prompt copié. » (`order-first` dans la rangée). L'alerte `training_setup_copy_failed` suit la rangée si `copy.failed`.
  - `TrainingSetup` gagne `configReady: boolean` (config chargée et valide, indépendamment de la base et de l'écriture).
  - Page : `PageShell` avec `icon={<SpaceIcon space="training" size="lg" />}` dans les deux modes ; `meta` = `training_setup_subtitle` en création, nom de l'entraînement en mise à jour. État `copy` (`useState<PromptCopy>({ copied: false, failed: false })`), `handleCopy` qui appelle `copyText(prompt)`. Formulaire `max-w-205`, `ol` sans `gap` (l'espacement vient des étapes). Rangée d'envoi `flex flex-wrap items-center gap-3 pl-12` : bouton (`default`), puis, si `!setup.configReady`, `training_setup_submit_blocker` en `text-small text-muted-foreground`, relié au bouton par `aria-describedby`.
  - Clés : `training_setup_subtitle: NoParams` (« Du cours à la première question, en quatre étapes. » / « From your course to the first question, in four steps. »), `training_setup_step_of: { step: number; total: number }` (« Étape {step} sur {total} » / « Step {step} of {total} »), `training_setup_step_state: { state: 'done' | 'current' | 'upcoming' }` (« Étape faite » / « Étape en cours » / « Étape à venir » ; « Step done » / « Current step » / « Upcoming step »), `training_setup_copy_again: NoParams` (« Copier à nouveau » / « Copy again »), `training_setup_show_prompt: NoParams` (« Afficher le prompt » / « Show the prompt »), `training_setup_submit_blocker: NoParams` (« Disponible une fois la config validée » / « Available once the config is valid »).

- [ ] **Step 1: Écrire les tests qui échouent**

`step-states.test.ts` :
- `au départ : 1 faite, 2 en cours, 3 et 4 à venir` — `{ copied: false, configChosen: false }` → `['done', 'current', 'upcoming', 'upcoming']`.
- `après copie : 1 à 3 faites, 4 en cours` — `{ copied: true, configChosen: false }` → `['done', 'done', 'done', 'current']`.
- `config déposée sans copie : 4 en cours` — `{ copied: false, configChosen: true }` → `['done', 'done', 'done', 'current']`.

`training-setup-page.test.tsx` (adapter `titre, retour à l'accueil et quatre étapes` : titres visés par regex, l'état est dans leur nom) et ajouter :
- `au départ, l'étape 2 est en cours : surtitre et aria-current` — `getByText('Étape 2 sur 4')` ; l'élément `li` du titre `/^Copiez le prompt/` porte `aria-current="step"` ; `getByRole('heading', { name: 'Rassemblez votre cours (Étape faite)' })` et `{ name: 'Déposez-la (Étape à venir)' }`.
- `la zone de dépôt est utilisable dès l'arrivée` — un fichier valide déposé sans copier le prompt active « C'est parti » et met l'étape 4 en cours.
- `copie réussie : étape résumée, focus gardé, prompt dans un repli` — clic sur « Copier le prompt » (focalisé avant le clic) : le bouton focalisé s'appelle maintenant « Copier à nouveau » (`toHaveFocus` sur `getByRole('button', { name: 'Copier à nouveau' })`), « Prompt copié. » affiché, `getByText('Afficher le prompt')` présent, l'étape 4 porte `aria-current="step"`.
- adapter `copie refusée : alerte, puis succès au nouvel essai` : après l'échec, « Étape 2 sur 4 » toujours là ; après le succès, résumé affiché.
- `« Copier à nouveau » refusé : résumé gardé, alerte` — succès, puis échec : « Copier à nouveau » toujours présent, alerte de copie affichée.
- `bouton désactivé sans config valide : une phrase le dit` — « Disponible une fois la config validée » affiché et cité par `aria-describedby` du bouton ; après un fichier valide, la phrase disparaît.
- `en-tête : tuile de l'espace et sous-titre` — `getByText('Du cours à la première question, en quatre étapes.')` ; en mise à jour, le nom de l'entraînement à la place.

`use-training-setup.test.ts` : `configReady` vrai après un fichier valide même base fermée, faux après un fichier invalide.

- [ ] **Step 2: Lancer les tests, vérifier qu'ils échouent**

Run: `rtk vitest run src/features/training-setup/`
Expected: FAIL (module `step-states` introuvable, textes absents).

- [ ] **Step 3: Implémenter `setupStepStates`, `SetupStep`, `PromptStep`, `configReady` et le câblage de la page**

`configChosen` se lit dans la page : `setup.config.kind !== 'empty'`. Les étapes 1 et 3 gardent leur paragraphe (`max-w-155 text-muted-foreground`) ; l'étape 4 garde `ConfigStep` tel quel jusqu'à la Task 3.

- [ ] **Step 4: Lancer les tests, vérifier qu'ils passent**

Run: `rtk vitest run src/features/training-setup/ src/lib/i18n/`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
rtk git add src/features/training-setup/ src/lib/i18n/
rtk git commit -m "💄 Donne un état aux étapes de mise en place et résume le prompt copié"
```

---

### Task 3: Étape 4 — dépôt compact, collage replié, compteurs et bilan

**Files:**
- Modify : `src/features/training-setup/components/config-step.tsx`, `src/features/training-setup/components/update-summary.tsx`
- Test : `src/features/training-setup/training-setup-page.test.tsx`
- Modify : `src/lib/i18n/ui-messages.ts`, `src/lib/i18n/ui-messages.test.ts`

**Interfaces:**
- Consumes : `FileDropField` `size="compact"` et `emptyHint` (Task 1).
- Produces :
  - `ConfigStep` (props inchangées) : `FileDropField size="compact" emptyHint={training_setup_drop_empty}` ; puis `details` (`max-w-155`) au `summary` « … ou collez le JSON ici » (`min-h-11 text-sm font-semibold text-muted-foreground`, chevron global de `index.css`), qui contient la zone de collage (`aria-label` = `training_setup_paste_label`, plus de `Label` séparé) et le bouton `outline` « Vérifier » (`aria-label` = `training_setup_check_paste`). Alertes, résultats, « Corriger dans l'éditeur » restent **hors** du repli, sous lui. Une config valide affiche son bloc résumé et, en mise à jour, le bilan, chacun dans `flex flex-col gap-2.5 border-t pt-4`.
  - Résumé : `h3 text-h3` (titre de l'examen), puis `ul` `aria-label` = `training_setup_category_counts`, `flex flex-wrap gap-2` ; un `li` par catégorie, style `categoryAccent(category)`, `inline-flex h-8 items-center gap-2 rounded-sm px-3 text-small font-semibold`, fond 12 % de la catégorie et texte de sa couleur (repli muted) ; contenu `aria-hidden` (`CategoryIcon size-4` si icône, libellé, compteur `text-foreground tabular-nums`) plus `span sr-only` = `training_setup_category_count` existant.
  - `UpdateSummary` (props inchangées) : `h3 text-h3` puis `ul aria-labelledby` `flex flex-wrap gap-3` de trois `li` `flex flex-[1_1_10rem] flex-col gap-1 rounded-md bg-muted p-4` : ligne icône + chiffre (`text-score-md font-bold tabular-nums`), libellé `font-semibold`, indication `text-small text-muted-foreground`. Conservées : `IconCircleCheck text-space-training` ; nouvelles : `IconCirclePlus text-foreground` ; retirées : `IconCircleMinus text-destructive`.
  - Clés : `training_setup_drop_empty: NoParams` (« Déposez la config (.json) ici » / « Drop the config (.json) here »), `training_setup_check_paste_short: NoParams` (« Vérifier » / « Check »), `training_setup_category_counts: NoParams` (« Questions par niveau » / « Questions per level »), `training_update_kept_label`, `training_update_added_label`, `training_update_removed_label` (`{ count: number }` : « conservée(s) », « nouvelle(s) », « retirée(s) » ; « kept », « new », « removed »), `training_update_kept_hint`, `training_update_added_hint`, `training_update_removed_hint` (`NoParams` : « Historique gardé », « Ajoutées au tirage », « N'apparaissent plus dans les stats » ; « History kept », « Added to the draw », « No longer in the stats »). `training_update_kept`, `training_update_added`, `training_update_removed` sont supprimées si plus rien ne les lit.

- [ ] **Step 1: Écrire les tests qui échouent**

Adapter les tests de collage (`JSON collé …`) : ouvrir d'abord le repli (`fireEvent.click(getByText('… ou collez le JSON ici'))`), viser la zone par `getByRole('textbox', { name: '… ou collez le JSON ici' })` et le bouton par `{ name: 'Vérifier le JSON collé' }`. Adapter `fichier valide : résumé par catégorie et bouton actif` : la liste `{ name: 'Questions par niveau' }` contient un `li` par catégorie, dont le texte `sr-only` est celui de `training_setup_category_count`. Adapter les tests du bilan : chaque `li` de la liste « Bilan de la mise à jour » a pour `textContent` le chiffre, le libellé et l'indication (« 20conservéesHistorique gardé » : comparer avec `toHaveTextContent(/20\s*conservées/)`). Ajouter :
- `JSON collé invalide : erreurs hors du repli, visibles une fois refermé` — collage invalide puis « Vérifier », refermer le repli : la liste d'erreurs et « Corriger dans l'éditeur » restent visibles.
- `zone de dépôt compacte : invite visible tant qu'aucun fichier n'est choisi` — « Déposez la config (.json) ici » ; après un fichier valide, « ou déposez-en un autre » et « Remplacer ».
- `catégorie sans couleur : pastille neutre` — config de test dont une catégorie n'a pas de `color` : son `li` n'a pas de `--category-color` dans `style`.

- [ ] **Step 2: Lancer les tests, vérifier qu'ils échouent**

Run: `rtk vitest run src/features/training-setup/`
Expected: FAIL.

- [ ] **Step 3: Implémenter `ConfigStep`, `UpdateSummary` et les clés**

- [ ] **Step 4: Lancer les tests, vérifier qu'ils passent**

Run: `rtk vitest run src/features/training-setup/ src/lib/i18n/`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
rtk git add src/features/training-setup/ src/lib/i18n/
rtk git commit -m "💄 Compacte l'étape de dépôt et met le bilan de mise à jour en cartes"
```

---

### Task 4: Écran d'entraînement — tuiles verrouillées, question en carte, réponse repliable

**Files:**
- Create : `src/features/training/components/locked-tiles.tsx`, `src/features/training/components/locked-tiles.test.tsx`
- Modify : `src/features/training/components/training-question.tsx`, `src/features/training/training-page.tsx`
- Test : `src/features/training/components/training-question.test.tsx`, `src/features/training/training-page.test.tsx`
- Modify : `src/lib/i18n/ui-messages.ts`, `src/lib/i18n/ui-messages.test.ts`

**Interfaces:**
- Consumes : `ScaleButtons` `variant="row"` (Task 1) ; `categoryAccent`, `CategoryBadge`, `CategoryIcon`, `formatScore`, `toMilli`, `categoryOfQuestion` existants.
- Produces :
  - `LockedTiles({ ui, config, currentCategoryId }: { ui: Ui; config: NormalizedConfig; currentCategoryId: string | undefined })` : `ul aria-label` = `training_tiles_locked`, `grid grid-cols-[repeat(auto-fit,minmax(10.625rem,1fr))] gap-3` ; un `li` par catégorie avec un `div` **non interactif** (style `categoryAccent`, `aria-current="true"` sur la catégorie courante) `flex h-14 items-center gap-2.5 rounded-lg px-3.5` : courante `border-2` à la couleur de la catégorie et fond 16 % ; autres bordure 35 %, fond 10 %, `opacity-45`. Contenu : `CategoryBadge size="md"`, libellé `min-w-0 truncate font-bold`, maximum `ml-auto shrink-0 text-small font-semibold tabular-nums` à la couleur de la catégorie (`passage_category_max`).
  - `TrainingQuestion` (props inchangées) : `section aria-label` = `present_prompt_label`, carte `flex flex-col gap-5 rounded-xl border p-7 wrap-anywhere`, style `categoryAccent(category)`, bordure 35 % et fond `color-mix(… 6%, var(--color-card))` (neutres si la question a disparu). En-tête : surtitre `text-label uppercase` à la couleur de la catégorie (`CategoryIcon size-4` si icône) « {label} · {passage_category_max} », puis `h2` (focus au montage, inchangé). Énoncé en `Markdown`. Avant révélation : rangée `flex flex-wrap items-center justify-between gap-4` avec « Voir la réponse » (`default`) et « Passer ». Après : `details` contrôlé (`open` initial vrai, `onToggle`) `rounded-lg bg-background`, `summary` `justify-between py-2.5 pr-3 pl-5 before:hidden` contenant le `h3` « Réponse » (`text-label uppercase text-muted-foreground`, `tabIndex={-1}`, focus à la révélation, inchangé) et « Masquer » / « Afficher » (`text-small font-semibold text-muted-foreground`, `IconChevronUp` / `IconChevronDown`) ; contenu `flex flex-col gap-3 px-5 pb-5` (réponse en `Markdown`, barème compris, ou `training_no_answer`). Puis rangée `flex flex-wrap items-end justify-between gap-4` : à gauche `h3` « Notez-vous » + `span font-normal text-muted-foreground` « · sur {max} » et `ScaleButtons variant="row"`, à droite « Passer ». « Passer » : `ghost`, `text-muted-foreground`, `IconPlayerSkipForward`, toujours présent, désactivé pendant l'écriture.
  - Page : `meta` = `training_subtitle({ pending })` ; « Mettre à jour la config » avec `IconRefresh`, « Voir les stats » avec `IconChartBar` (`data-icon="inline-start"`). Pendant une question : `LockedTiles` (`currentCategoryId` = `categoryOfQuestion(config, pending.questionId)?.id`) au-dessus de `TrainingQuestion`. Sans question : `TrainingTiles` inchangé.
  - Clés : `training_subtitle: { pending: boolean }` (« Entraînement » / « Entraînement · question en cours » ; « Practice » / « Practice · question in progress »), `training_tiles_locked: NoParams` (« Catégories (indisponibles pendant la question) » / « Categories (unavailable during the question) »), `training_answer_hide: NoParams` (« Masquer » / « Hide »), `training_answer_show: NoParams` (« Afficher » / « Show »), `training_score_max: { max: string }` (« · sur {max} » / « · out of {max} »).

- [ ] **Step 1: Écrire les tests qui échouent**

`locked-tiles.test.tsx` :
- `une tuile par catégorie, la courante marquée` — config de `makeTrainingConfig()`, `currentCategoryId` d'une catégorie : liste `{ name: 'Catégories (indisponibles pendant la question)' }`, autant de `li` que de catégories, un seul élément `[aria-current="true"]`, aucun `button`.
- `sans catégorie courante : aucune marquée` — `currentCategoryId={undefined}` : aucun `[aria-current]`.

`training-question.test.tsx` :
- `en-tête : niveau et points, carte teintée` — question `b-1` : texte « {label} · {N pts} » de sa catégorie ; la `section` porte `--category-color` dans son `style`.
- `« Masquer » replie la réponse, la notation reste` — révéler, cliquer « Masquer » : le `details` n'a plus `open`, « Afficher » visible, `getByRole('button', { name: 'Noter 1' })` présent et actif, « Passer » actif.
- `« Notez-vous · sur N »` — après révélation : `getByRole('heading', { level: 3, name: 'Notez-vous · sur 1' })` (adapter `N` au barème de `b-1`).
- adapter `question absente de la config` : la `section` n'a pas de `--category-color`.

`training-page.test.tsx` :
- `pendant une question : tuiles verrouillées, sous-titre de question` — après un tirage : liste des tuiles verrouillées présente, la catégorie tirée `aria-current`, `getByText('Entraînement · question en cours')` ; la liste « Choisissez une catégorie » absente.
- `sans question : sous-titre « Entraînement »`.
- `question en attente sur une question disparue : aucune tuile marquée` — journal avec un tirage `pending` sur un id absent de la config.

- [ ] **Step 2: Lancer les tests, vérifier qu'ils échouent**

Run: `rtk vitest run src/features/training/`
Expected: FAIL.

- [ ] **Step 3: Implémenter `LockedTiles`, `TrainingQuestion`, le câblage de la page et les clés**

- [ ] **Step 4: Lancer les tests, vérifier qu'ils passent**

Run: `rtk vitest run src/features/training/ src/lib/i18n/`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
rtk git add src/features/training/ src/lib/i18n/
rtk git commit -m "💄 Met la question d'entraînement en carte, réponse repliable et tuiles verrouillées"
```

---

### Task 5: e2e, disposition à 390 px, captures, canevas et mémoire

**Files:**
- Modify : `e2e/pages/training-setup-page.ts`, `e2e/pages/training-page.ts` (si besoin), `e2e/training.spec.ts` (seulement si une assertion de forme casse)
- Create : `e2e/training-layout.spec.ts`
- Modify : canevas (artboards `entrainement-mise-en-place`, `entrainement-mise-a-jour`, `entrainement-question` si écart), `docs/INDEX.md`, `docs/HANDOFF.md`, `docs/DECISIONS.md` (D111), `docs/BACKLOG.md`, `docs/QUIRKS.md` et `docs/CONVENTIONS.md` si besoin, corps de la PR #154

**Interfaces:**
- Consumes : tout ce qui précède.
- Produces : `TrainingSetupPage.pasteConfig(text)` ouvre le repli « … ou collez le JSON ici » s'il est fermé (`summary` cliqué, puis zone remplie) et clique « Vérifier » (`{ name: 'Vérifier le JSON collé' }`).

- [ ] **Step 1: Adapter les page objects et lancer l'e2e d'entraînement**

Run: `rtk playwright test e2e/training.spec.ts e2e/update.spec.ts e2e/languages.spec.ts`
Expected: PASS. Un échec qui n'est pas de forme (navigation, note, couverture, bilan) est une régression : la corriger dans la tâche qui l'a introduite.

- [ ] **Step 2: Écrire le test de disposition à 390 px**

`e2e/training-layout.spec.ts`, `test.use({ viewport: { width: 390, height: 844 } })`, avec `overflowWidth` repris de `stats-layout.spec.ts` (copié, pas importé) :
- `mise en place à 390 px : aucun débordement` — config d'entraînement d'exemple modifiée : 13 catégories (catégories de l'exemple dupliquées avec des ids neufs) et un libellé insécable de 55 caractères ; collée, validée : `overflowWidth(page) <= 0`.
- `question à 390 px : tuiles verrouillées sur deux colonnes, aucun débordement` — même config, « C'est parti », tirage, révélation : les deux premiers `li` des tuiles verrouillées ont le même `top` ; `overflowWidth(page) <= 0`.

Run: `rtk playwright test e2e/training-layout.spec.ts`
Expected: PASS (sinon corriger la classe fautive avec ce test comme témoin).

- [ ] **Step 3: Vérification complète**

Run: `pnpm check && rtk playwright test && pnpm build && pnpm check:bundle && pnpm check:precache && pnpm check:budget`
Expected: tout vert (nombre de tests unitaires et e2e noté pour le journal).

- [ ] **Step 4: Captures et comparaison aux artboards**

Config Playwright jetable dans `.superpowers/sdd/2026-10-18-f44-9-entrainement/cap/` (HANDOFF F44.6) : captures 1280 et 390 px de la mise en place (départ, après copie, config valide), de la mise à jour (bilan) et d'une question révélée ; les comparer aux trois artboards. Corriger les écarts non voulus avec un test qui échoue d'abord. Mettre à jour les artboards des écarts voulus (au minimum : légende « Config (JSON) » et texte d'état visibles dans la zone compacte, tuiles verrouillées non interactives si l'artboard le montre) : `read` de l'URL du canevas seule avant de publier (QUIRKS 2026-10-17).

- [ ] **Step 5: Mémoire, décision, PR**

- `docs/DECISIONS.md` : D111 (F44.9), même gabarit que D109 : règle d'état des étapes, copie et focus, collage replié avec erreurs hors du repli, dépôt compact, pastilles, bilan en cartes, tuiles verrouillées non interactives, réponse repliable, briques (`FileDropField size`, `ScaleButtons variant`), écarts reportés au canevas.
- `docs/INDEX.md`, `docs/HANDOFF.md` (quatre marqueurs en gras), `docs/BACKLOG.md` (mineurs de la relecture), `docs/QUIRKS.md` si piège découvert.
- Section #151 dans le corps de la PR #154 (gabarit `.github/pull_request_template.md`) ; push, CI et `.claude/scripts/sonar-check.sh --pr 154 --wait` verts. La PR reste en brouillon (D110).

```bash
rtk git add e2e/ docs/
rtk git commit -m "✅ Vérifie la disposition de l'entraînement à 390 px et note F44.9"
rtk git push
```

Puis demander la validation de #151 à l'utilisateur en local (`pnpm dev`), avec la liste des vérifications.
