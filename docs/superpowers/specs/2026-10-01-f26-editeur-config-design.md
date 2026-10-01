# F26 — Éditeur de config — Design

- **Date** : 2026-10-01
- **Ticket** : [#60](https://github.com/AdrienGras/questionator-z4000-hyperdrive/issues/60)
- **Branche** : `feat/f26-editeur-config`
- **Statut** : design validé en conversation, figé ici avant le plan d'implémentation.

## Contexte

Retours des tests manuels V1. Pour voir le rendu de ses questions, l'auteur d'une config doit créer une session puis tirer les questions une à une. Les erreurs du validateur n'apparaissent qu'à la création de session, par leur chemin (`categories[1].questions[0].id`), sans lien avec la ligne du fichier.

Existant utile : `validateConfig(text, { cssSupports })` (`domain/config/validate.ts`, chargé à la demande par `import()`, ~200 kB) renvoie des `ConfigIssue` `{ severity, code, path, params }` ; `json_syntax` porte `line` / `column` (localisés par `jsonc-parser`, déjà en dépendance) ; `formatConfigIssue(issue, locale)` les traduit (fr, en). La création de session lit un fichier de config par `useCreateForm.setConfigFile(file)`. Depuis F22, les écrans projetés sont dans `components/projection/` (`ProjectedScreen`) et l'aperçu réduit (`ProjectionPreview`, `features/session/`) les rend dans un canevas 1280 × 720. Depuis F20, l'accueil a une colonne de cartes d'action (`ActionCards`).

Références : [`PRODUCT.md`](https://github.com/AdrienGras/questionator-z4000-hyperdrive/blob/main/PRODUCT.md) §6.2, F02, F03, F06, F09, F14 · `docs/DECISIONS.md` D15, D18, D59, D60, D62, D77, D78.

## Objectif

Une page « Éditeur de config », ouverte depuis une troisième carte de l'accueil : à gauche l'éditeur JSON validé en direct, chaque issue reliée à sa ligne ; à droite l'aperçu de toutes les questions et de l'écran final. On en repart avec le fichier téléchargé ou une session à créer.

## Décisions (D80)

| Sujet | Décision | Raison |
|---|---|---|
| Accès | Troisième carte d'action « Éditer une config » sur l'accueil, même format que les deux autres, lien vers `/editor` | Demandé par le ticket et l'utilisateur. |
| Route | `/editor`, feature `src/features/config-editor/` | Découpage par route de TanStack : CodeMirror n'entre que dans le chunk de l'éditeur. |
| Éditeur | CodeMirror 6 sans wrapper React (`@codemirror/state`, `view`, `commands`, `language`, `lang-json`, `lint`, `autocomplete`) | Pas de dépendance d'enrobage ; montage dans un `useEffect`, API impérative réduite. |
| Couleurs de l'éditeur | Thème CodeMirror et `HighlightStyle` écrits sur des variables CSS (`--cm-*`) définies dans `index.css` pour `:root` et `.dark` | Le mode clair / sombre de l'application suit sans reconfiguration. |
| Validation | `validateConfig` 300 ms après la dernière frappe ; la dernière config valide est conservée | Fluide à la frappe ; l'aperçu reste affichable pendant une erreur. |
| Position d'une issue | `json_syntax` : ligne / colonne → décalage. Sinon `parseTree` + `findNodeAtLocation` de `jsonc-parser` sur le `path`, en remontant au premier nœud existant ; nœud de propriété → paire clé-valeur, sinon la valeur | Le ticket l'impose ; la remontée couvre les champs manquants. |
| Brouillon | Une clé `localStorage` `questionator:config-draft`, écrite après le même délai ; départ : brouillon, sinon l'exemple (`examples/config.example.json?raw`) | Pas de réseau pour l'exemple, hors ligne garanti. |
| Charger / repartir de l'exemple | Remplacement du texte par une transaction annulable (Ctrl+Z), sans confirmation | L'historique de l'éditeur sert de filet. |
| Thème de la config | Appliqué à la seule colonne d'aperçu (`ThemeScope`, variables CSS du mode effectif) | Choix utilisateur ; `@theme inline` fait lire `var(--…)` aux utilitaires, une portée locale suffit. |
| Questions de l'aperçu | Une carte par question : en-tête (catégorie, id, titre, barème), énoncé `<Markdown size="projection">`, réponse dans un `<details>` replié | Choix utilisateur : lisible, même rendu de texte que la projection. |
| Écran final | `ProjectionCanvas` (canevas 1280 × 720 de F22, remonté dans `components/projection/`) avec `ProjectedScreen` sur `toProjectedView(previewSession(config))` | Choix utilisateur : exactement l'écran projeté, en miniature. |
| Config invalide | Dernier aperçu valide affiché, bandeau « Aperçu périmé » et opacité réduite ; avant toute config valide, un message | Demandé par le ticket. |
| Téléchargement | Texte exact de l'éditeur ; nom `<slugify(exam.title)>.json` si le JSON se parse et porte un titre, sinon `config.json` | Demandé par le ticket. |
| Passage vers la création | `lib/config-handoff.ts` : `sessionStorage` `{ text, fileName }`, repris une fois au montage de la création (`useCreateForm.setConfigText`) | Pas d'import entre features (D59) ; survit à un rechargement de `/new`. |

## Architecture

### Accueil — `src/features/home/components/action-cards.tsx`

Troisième carte, après « Restaurer une session » : titre `home_editor_title` (fr « Éditer une config », en « Edit a config »), icône `IconFileCode`, texte `home_editor_body` (fr « Écrivez ou corrigez un fichier de configuration : les erreurs sont signalées en direct et les questions affichées telles qu'elles seront projetées. » ; en « Write or fix a configuration file: errors are flagged as you type and questions are shown as they will be projected. »), lien stylé bouton `home_editor_open` (fr « Ouvrir l'éditeur », en « Open the editor ») vers `/editor`. Toujours affichée (l'éditeur ne dépend pas de la base).

### Partagé

- `src/lib/appearance/theme-variables.ts` : `themeVariables(tokens: ThemeTokens): Record<`--${string}`, string>` (`token` → `--token`, valeurs `undefined` ignorées). `AppearanceProvider` l'utilise.
- `src/components/theme-scope.tsx` : `ThemeScope({ theme, children, className })` — `theme: NormalizedConfig['theme']` ; lit le mode effectif (`useColorModeControl` ou équivalent existant de `lib/appearance`) et pose `themeVariables(theme[mode])` en `style` d'un `div`.
- `src/components/projection/projection-canvas.tsx` : `ProjectionCanvas({ view, className })` — la boîte mesurée et le canevas réduit de `ProjectionPreview` (constantes 1280 × 720, `aria-hidden`, `inert`, caché avant mesure, `animate={false}`). `ProjectionPreview` garde sa `section` et son `h2` et rend `ProjectionCanvas`.
- `src/domain/presentation/preview-session.ts` : `previewSession(config: NormalizedConfig, now?: Date): Session` — session `id: 'preview'`, nom = titre de l'examen, un étudiant `{ firstName: 'Ada', lastName: 'Lovelace' }` projeté et actif, `questionsPerStudent` passages `scored` (catégories parcourues dans l'ordre, questions dans l'ordre, note = valeur du milieu du barème trié), `finalRevealedAt` renseigné. Pure, sans React.
- `src/lib/config-handoff.ts` : `stashConfigForCreation({ text, fileName })`, `takeConfigForCreation(): { text: string; fileName: string } | undefined` (lit puis efface ; `sessionStorage` indisponible → `undefined`, sans exception).

### Création — `src/features/create-session/`

- `useCreateForm` : `setConfigText(text: string, fileName: string): Promise<void>`, même chemin que `setConfigFile` après lecture (slot `reading` puis `loaded` / `load-error`) ; `setConfigFile` le réutilise.
- `CreateSessionPage` : au montage, `takeConfigForCreation()` ; si présent, `setConfigText`.

### Éditeur — `src/features/config-editor/`

- `issue-locations.ts` : `locateIssue(text: string, issue: ConfigIssue): { from: number; to: number }` ; `json_syntax` sans position → `{ from: 0, to: 0 }`.
- `editor-theme.ts` : extension CodeMirror (thème + `syntaxHighlighting` d'une `HighlightStyle` sur `--cm-string`, `--cm-number`, `--cm-keyword` (true/false/null), `--cm-property`, `--cm-punctuation`) ; variables dans `index.css` (clair et sombre).
- `components/json-editor.tsx` : `JsonEditor` (`forwardRef` ou prop `apiRef`) — props `initialText`, `onChange(text)`, `diagnostics: Diagnostic[]`, `ariaLabel` ; API `{ setText(text): void; reveal(from, to): void }` (`reveal` : sélection + `scrollIntoView` + focus). Extensions : `basicSetup` minimal équivalent (numéros de ligne, historique, `closeBrackets`, indentation, `json()`, `lintGutter`), `editor-theme`. Les diagnostics passent par `setDiagnostics`.
- `hooks/use-config-draft.ts` : `useConfigDraft(): { initialText: string; save(text): void }` (lecture synchrone au premier rendu, écriture tolérante aux erreurs de stockage).
- `hooks/use-live-validation.ts` : `useLiveValidation(text, locale?): { result: ValidationResult | undefined; lastValid: NormalizedConfig | undefined; pending: boolean }` — délai 300 ms, `import('@/domain/config/validate')`, `cssSupports` comme la création.
- `components/issue-list.tsx` : liste (erreurs puis avertissements) ; chaque ligne est un bouton « message » + chemin (`formatPath`), `onSelect(issue)`.
- `components/question-preview.tsx` : carte d'une question (en-tête : pastille de couleur et icône de catégorie, libellé, `id`, titre, barème joint par « / » ; énoncé `<Markdown size="projection">` ; `<details>` « Réponse attendue » avec `<Markdown>` ; absence de réponse → pas de `<details>`).
- `components/config-preview.tsx` : `ThemeScope` sur la dernière config valide ; questions groupées par catégorie (titre de catégorie `h3`), puis `h3` « Écran final » + `ProjectionCanvas` ; prop `stale` → bandeau `role="status"` « Aperçu périmé : la config contient des erreurs. » et `opacity-60` ; sans config valide → message « L'aperçu apparaîtra dès que la config sera valide. ».
- `config-editor-page.tsx` : `PageShell` (retour accueil, titre « Éditeur de config ») ; grille `lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]` ; colonne gauche `lg:sticky lg:top-4 lg:self-start` (éditeur `h-[60vh]` en dessous de `lg`, `lg:h-[calc(100svh-12rem)]`), barre d'outils (« Charger un fichier », « Repartir de l'exemple », « Télécharger », « Créer une session avec cette config »), liste des issues ; colonne droite : `ConfigPreview`. Glisser-déposer d'un fichier sur la colonne gauche. « Créer… » désactivé si `result?.ok !== true` : `stashConfigForCreation` puis `navigate({ to: '/new' })`.
- `src/routes/editor.tsx` : route mince.

### i18n

Clés `editor_*` (titre, libellé de l'éditeur, boutons, titres de colonnes, état périmé, message sans config valide, « Réponse attendue », « Écran final », compteurs d'issues « Aucune erreur » / « {n} erreur(s), {m} avertissement(s) ») et `home_editor_*`, en fr et en en, avec la table `SAMPLE`.

### Contrôles de build

- `scripts/check-initial-bundle.ts` : CodeMirror (`@codemirror/`, `@lezer/`) ajouté aux motifs interdits du bundle initial.
- `pnpm check:precache` vert (chunk CodeMirror sous le plafond).

## Tests

- **Unitaires (Vitest)** :
  - `themeVariables` ; `ThemeScope` (variables du mode effectif posées sur le `div`).
  - `ProjectionCanvas` (les tests de `ProjectionPreview` restent verts).
  - `previewSession` : `questionsPerStudent` passages notés, note du milieu du barème, `finalRevealedAt` présent ; `toProjectedView` donne `final` défini.
  - `config-handoff` : dépôt puis reprise unique ; stockage qui lève → `undefined`.
  - `useCreateForm.setConfigText` : slot `loaded` avec le nom fourni ; `CreateSessionPage` reprend la config déposée (nom de fichier affiché, config validée).
  - `locateIssue` : virgule manquante (position de `json_syntax`), `duplicate_question_id` (ligne de l'`id` en double), `required` (champ absent → nœud parent), `unknown_key` (paire clé-valeur), issue de chemin vide.
  - `useConfigDraft`, `useLiveValidation` (délai, `lastValid` conservé quand le texte devient invalide).
  - `IssueList` (ordre, clic → `onSelect`), `QuestionPreview` (réponse repliée, sans réponse pas de `<details>`), `ConfigPreview` (périmé, sans config).
  - `JsonEditor` : monte avec `initialText`, `setText` remplace et reste annulable (`undo`), `onChange` appelé.
  - `ActionCards` : carte « Éditer une config » et lien `/editor`.
- **e2e (Playwright)** `e2e/config-editor.spec.ts` :
  - l'accueil ne charge aucun chunk CodeMirror ; la carte « Éditer une config » ouvre l'éditeur sur l'exemple ;
  - virgule supprimée → issue de syntaxe, diagnostic sur la bonne ligne ;
  - `id` de question dupliqué → issue avec le message de la création, soulignement sur la ligne du doublon ; clic sur l'issue → curseur sur cette ligne ;
  - aperçu marqué périmé pendant l'erreur, à jour après correction ; énoncés présents, réponse repliée, écran final ;
  - « Télécharger » → contenu identique au texte de l'éditeur ;
  - « Créer une session avec cette config » → `/new` avec la config chargée ; CSV d'exemple déposé → session créée ;
  - rechargement → brouillon retrouvé.
- Vérification manuelle (PR) : hors ligne avec `pnpm build && pnpm preview`, mode clair et sombre, thème de la config limité à l'aperçu.

## Documentation

D80 ; `PRODUCT.md` F26 (et F05 : troisième carte) ; `INDEX.md`, `BACKLOG.md` (autocomplétion et survol par le JSON Schema, `codemirror-json-schema`), `CONVENTIONS.md` (portée de thème locale, CodeMirror), `ENVIRONMENT.md` si un script change, `HANDOFF.md`.

## Critères d'acceptation

- [ ] Depuis l'accueil, la carte « Éditer une config » ouvre l'éditeur avec l'exemple, ou avec le brouillon précédent.
- [ ] Une virgule manquante est signalée à sa position ; un identifiant de question en double est souligné sur la bonne ligne, avec le même message qu'à la création.
- [ ] Cliquer une issue de la liste place le curseur sur le nœud concerné.
- [ ] L'aperçu affiche toutes les questions avec le rendu de la vue projetée et la réponse repliée, puis l'écran final factice.
- [ ] Une config invalide laisse le dernier aperçu valide, marqué comme périmé.
- [ ] Le fichier téléchargé est identique au texte de l'éditeur.
- [ ] « Créer une session avec cette config » ouvre la création avec la config chargée et validée.
- [ ] Recharger la page retrouve le brouillon.
- [ ] L'éditeur marche hors ligne ; l'accueil ne charge pas CodeMirror.

## Hors périmètre

- Autocomplétion et aide au survol depuis le JSON Schema (`codemirror-json-schema`) → BACKLOG.
- Simulation d'un tirage ou d'une notation, édition du CSV des étudiants.
