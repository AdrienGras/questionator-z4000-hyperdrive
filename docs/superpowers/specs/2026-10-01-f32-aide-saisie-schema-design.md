# F32 — Aide à la saisie depuis le JSON Schema — Design

- **Date** : 2026-10-01
- **Ticket** : [#80](https://github.com/AdrienGras/questionator-z4000-hyperdrive/issues/80)
- **Branche** : `feat/80-aide-saisie-schema`
- **Statut** : design validé en conversation, figé ici avant le plan d'implémentation.

## Contexte

L'éditeur de config (F26, D80) valide en direct mais ne propose rien pendant la frappe : il faut connaître les noms de champs (`questionsPerStudent`, `finalScoreDisplay`…) et leurs valeurs permises. Le JSON Schema publié (`config.schema.json`, D17) sert déjà à VSCode, mais il ne contient aucune description : le survol n'explique rien, même dans VSCode.

Existant utile :
- `ConfigSchema` (Zod 4, `src/domain/config/schema.ts`) et `buildConfigJsonSchema()` (`src/domain/config/json-schema.ts`), appelé au build par `configSchemaPlugin`. Le schéma généré est entièrement en ligne (ni `$ref` ni `$defs`) ; `.meta({ description, default })` de Zod ressort tel quel dans la sortie (vérifié).
- `buildConfigJsonSchema` remplace le nœud `icon` par `anyOf: [{ enum: ICON_NAMES }, { type: 'string' }]` en vidant le nœud d'origine.
- `CONFIG_DEFAULTS` (`src/domain/config/defaults.ts`) : défauts de `PRODUCT.md` §6.2, appliqués par la normalisation.
- `JsonEditor` (`src/features/config-editor/components/json-editor.tsx`) : CodeMirror 6 monté sans wrapper, chunk `codemirror` interdit au bundle initial (`check:bundle`). `jsonc-parser` et `@codemirror/autocomplete` sont déjà en dépendance.

Références : `PRODUCT.md` §6.2, F02, F26 · `docs/DECISIONS.md` D17, D37, D80.

## Objectif

Le schéma décrit chaque champ ; l'éditeur de l'application en tire l'autocomplétion et l'aide au survol, comme VSCode.

## Décisions (D87)

| Sujet | Décision | Raison |
|---|---|---|
| Langue des descriptions | Français seul, un seul schéma publié | Choix de l'utilisateur : public francophone, comme `PRODUCT.md`. Un JSON Schema ne porte qu'une langue. |
| Source des descriptions | `.meta({ description })` sur chaque champ de `ConfigSchema`, texte tiré du tableau de `PRODUCT.md` §6.2 | Le schéma Zod reste la source unique ; le JSON Schema les hérite. |
| Défauts | `.meta({ default })` sur les champs optionnels qui en ont un, valeur lue dans `CONFIG_DEFAULTS` (pas recopiée) | Une seule source : le survol ne peut pas diverger de la normalisation. |
| Jetons de thème | Description générique construite par jeton (« Variable CSS `--primary` du thème clair ») | 64 nœuds ; un texte par jeton n'apporterait rien de plus que son nom. |
| Icône | L'`override` de `buildConfigJsonSchema` conserve `description` et `default` du nœud qu'il remplace | Sinon l'aide disparaît sur `icon`. |
| Bibliothèque d'éditeur | Complétion et survol maison : `jsonc-parser` + `@codemirror/autocomplete` + `hoverTooltip` (approche A) | `codemirror-json-schema` 0.8.1 n'est plus maintenu depuis avril 2025 et tire shiki v1 (doublon de notre v4), `markdown-it`, `yaml`, `json-schema-library`. |
| Schéma côté éditeur | `buildConfigJsonSchema()` appelé dans le chunk de l'éditeur, mémorisé au premier usage | Pas de réseau ni d'état de chargement ; Zod et la liste d'icônes sont déjà chargés par la validation en direct. |
| Hors périmètre | Validation par le JSON Schema ; extraits de blocs entiers (squelette d'une catégorie) | Le validateur de l'app reste la référence (ticket) ; YAGNI. |

## Conception

### 1. Descriptions dans le schéma (`src/domain/config/schema.ts`)

- Chaque propriété de `ConfigSchema` (racine, `exam`, `scoring`, `rounding`, `absent`, `skips`, `presentation`, `theme`, catégorie, question) reçoit `.meta({ description })`, posé sur le schéma final de la propriété (après `.optional()` / `.nullable()`) pour être attaché au nœud de la propriété dans le JSON Schema.
- Les champs optionnels présents dans `CONFIG_DEFAULTS` reçoivent aussi `default: CONFIG_DEFAULTS.<groupe>.<champ>`. Les objets de groupe (`rounding`, `skips`…) n'ont pas de `default` : leur description dit que tous leurs champs sont optionnels.
- `ThemeSchema` devient une fabrique `themeSchema(mode)` qui pose la description générique de chaque jeton selon `light` / `dark`.
- Effet sur la validation : aucun (`.meta` n'est que métadonnée). Les messages d'erreur (`from-zod.ts`) ne bougent pas.

### 2. Module pur `src/features/config-editor/schema-assist.ts`

Aucune dépendance à CodeMirror ni à React : texte, position et JSON Schema en entrée, données en sortie.

- `type SchemaNode` : sous-ensemble lu du JSON Schema (`type`, `properties`, `items`, `anyOf`, `enum`, `const`, `description`, `default`).
- `schemaAt(root, path)` : descend par `properties[clé]` pour une clé, `items` pour un indice ; à travers `anyOf`, prend la première branche qui sait répondre. Renvoie `undefined` hors schéma (clé inconnue).
- `completionsAt(text, offset, root)` : `getLocation(text, offset)` de `jsonc-parser`.
  - Sur une clé (`isAtPropertyKey`) : propriétés de l'objet parent absentes du texte (clés sœurs lues par `parseTree` + `findNodeAtLocation`), chacune avec sa description. Insertion : `"clé": ` ; la plage remplacée couvre le jeton en cours (guillemets compris).
  - Sur une valeur : `enum` et `const` (JSON sérialisé), `true` / `false` pour `boolean`, `null` si le type l'admet, à travers `anyOf` (donc les ~5 000 noms d'icônes Tabler, filtrés par CodeMirror à la frappe).
  - Texte invalide en cours de frappe : `getLocation` tolère l'erreur ; si le chemin ne mène à aucun nœud, aucune proposition.
- `hoverAt(text, offset, root)` : sur une clé connue, `{ from, to, description, default? }` ; ailleurs, `undefined`.
- `configJsonSchema()` : `buildConfigJsonSchema()` mémorisé (un seul calcul par chargement de page).

### 3. Branchement dans `JsonEditor`

- `autocompletion({ override: [source] })` où `source` adapte `completionsAt` à `CompletionContext` (`from`, `options` avec `label`, `apply`, `info` = description). `completionKeymap` ajouté au keymap : Ctrl+Espace ouvre la liste ; l'activation à la frappe reste celle par défaut.
- `hoverTooltip` sur `hoverAt` : description, puis « Défaut : `<valeur JSON>` » (libellé `editor_hover_default` dans le catalogue i18n, fr et en ; la description reste en français).
- Styles des infobulles (`.cm-tooltip`, `.cm-tooltip-autocomplete`, `.cm-completionInfo`) dans `editor-theme.ts` sur les variables `--cm-*`, clair et sombre.
- Tout reste importé par `JsonEditor` : chunk `codemirror`, aucune fuite dans le bundle initial.

## Tests

- **Schéma** (`json-schema.test.ts`) : un parcours du JSON Schema généré échoue si une propriété n'a pas de `description` ; les `default` de `rounding`, `absent`, `skips` et `presentation` égalent `CONFIG_DEFAULTS` ; `icon` garde sa description à côté de son `anyOf`.
- **Module pur** (`schema-assist.test.ts`) : clés proposées au bon niveau (racine, `scoring`, catégorie dans le tableau), clés déjà présentes exclues, énumérations (`rounding.mode`, `locale`), `true`/`false`, `null` pour `step`, icônes, texte invalide en cours de frappe, survol d'une clé avec et sans défaut, survol hors clé.
- **Composant** (`json-editor.test.tsx`) : la source de complétion est branchée (une `CompletionContext` sur l'état de la vue renvoie des options).
- **e2e** (`e2e/config-editor.spec.ts`) : Ctrl+Espace dans `scoring` propose `questionsPerStudent` ; le survol de `finalScoreDisplay` affiche sa description et son défaut.
- **Bundle** : `pnpm build && pnpm check:bundle && pnpm check:precache` inchangés.

## Critères d'acceptation (ticket)

- Dans VSCode, le survol d'un champ d'une config affiche sa description et son défaut.
- Dans l'éditeur de l'app, Ctrl+Espace propose les clés possibles à l'endroit du curseur et les valeurs d'une énumération.
- Le survol d'une clé affiche sa description.
- L'accueil ne charge toujours pas CodeMirror ; l'éditeur marche hors ligne.

## Documentation à mettre à jour

`docs/DECISIONS.md` (D87), `PRODUCT.md` F26 et §6.2 (phrase sur les descriptions), `docs/INDEX.md`, `docs/BACKLOG.md` (deux items → #80 cochés), `docs/HANDOFF.md`, `README.md` (« Écrire une config » : survol décrit).
