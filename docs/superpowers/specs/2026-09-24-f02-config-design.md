# F02 — Schéma de configuration et validation — Design

- **Date** : 2026-09-24
- **Ticket** : [#2](https://github.com/AdrienGras/questionator-z4000-hyperdrive/issues/2)
- **Branche** : `feat/f02-config`
- **Statut** : spec validée en conversation, figée ici avant le plan d'implémentation.

## Contexte

Le fichier de config JSON est le contrat de tout le reste : catégories, questions, barèmes, règles de notation, thème. F02 le charge, le valide, l'explique, et publie un JSON Schema pour l'autocomplétion dans l'éditeur.

Références : [`PRODUCT.md`](https://github.com/AdrienGras/questionator-z4000-hyperdrive/blob/main/PRODUCT.md) §6.2 et F02 · [`docs/DECISIONS.md`](https://github.com/AdrienGras/questionator-z4000-hyperdrive/blob/main/docs/DECISIONS.md) D01, D04–D06, D14–D18, D20, D37, D38–D41.

## Objectif

`validateConfig(text, { cssSupports })` est une fonction pure et portable (navigateur, Vitest sous Node, plugin Vite). Elle renvoie soit une config normalisée prête à être figée dans une session, soit la liste complète des issues, chacune avec son chemin JSON et un code traduit en fr/en. Un JSON Schema publié à une URL stable donne l'autocomplétion dans VSCode.

## Dépendances à ajouter

- `zod` v4 (dépendance) : `z.strictObject`, `z.toJSONSchema()`.
- `ajv` (devDependency) : test du fichier d'exemple contre le JSON Schema généré (`ajv/dist/2020`).

## Modules

```
src/config/
  schema.ts         schéma Zod structurel strict, SCHEMA_VERSION = 1, THEME_TOKENS
  issues.ts         ConfigIssue, ConfigIssueCode, conversion des issues Zod, formatPath()
  rules.ts          checkRules(parsed, { cssSupports, iconNames }) → ConfigIssue[]
  normalize.ts      normalize(parsed) → NormalizedConfig (défauts, tri, title dérivé)
  derive-title.ts   deriveTitle(prompt) : texte brut, 60 caractères max
  validate.ts       validateConfig(text, { cssSupports })
  messages.ts       dictionnaires fr/en typés, un message par code
  json-schema.ts    buildConfigJsonSchema() : partagé par le plugin et le test ajv
src/i18n/           noyau minimal : Locale, SUPPORTED_LOCALES, t()   (étendu par F07)
vite/config-schema-plugin.ts
examples/config.example.json
```

## Flux de `validateConfig`

```
validateConfig(text, { cssSupports })
  1. JSON.parse                 échec → [json_syntax {line, column}]             ok:false
  2. pré-contrôle de version    objet avec schemaVersion entier > SCHEMA_VERSION
                                → [unsupported_schema_version {found, supported}] ok:false
  3. ConfigSchema.safeParse     échec → issues Zod converties (toConfigIssues)    ok:false
  4. checkRules(parsed, …)      erreurs + avertissements
  5. erreurs présentes          → ok:false, toutes les issues
     sinon                      → ok:true, config: normalize(parsed), issues = avertissements
```

Signature :

```ts
type ConfigIssue = {
  severity: 'error' | 'warning'
  path: (string | number)[]
  code: ConfigIssueCode
  params: ParamsOf<ConfigIssueCode>
}

validateConfig(text: string, deps: { cssSupports: (property: string, value: string) => boolean })
  : { ok: true; config: NormalizedConfig; issues: ConfigIssue[] }   // avertissements seuls
  | { ok: false; issues: ConfigIssue[] }
```

Les règles croisées sont une **passe séparée** après un parse structurel réussi (D38) : même comportement que `superRefine` (D18), mais elles produisent directement des `ConfigIssue` avec leur sévérité et restent hors du schéma exporté en JSON Schema.

Le pré-contrôle de version (D39) renvoie **uniquement** l'issue de version : une config d'une version future contient probablement des champs inconnus, et une avalanche d'`unknown_key` noierait le seul message utile (recharger la page).

## Schéma (`schema.ts`)

- **Strict à tous les niveaux** (`z.strictObject`). `$schema` est déclaré dans le schéma racine (`z.string().optional()`) : aucune exception au mode strict n'est nécessaire (D05).
- `schemaVersion` : `z.literal(SCHEMA_VERSION)`.
- **Aucun `.default()`** : les champs optionnels restent optionnels dans le JSON Schema ; les défauts sont appliqués par `normalize.ts`, en un seul endroit.
- Pas de `categories[].maxPoints` : la valeur d'une catégorie est `max(scale)` (D04).
- Chaînes obligatoires (`exam.title`, `categories[].id`, `label`, `questions[].id`, `prompt`) : non vides après `trim()` → code `empty_string`.
- Valeurs CSS (tokens de thème, `categories[].color`) : **forme seulement** — chaîne non vide, sans `;`, `{`, `}`, `<` → code `invalid_css_shape` (D15).
- `categories[].icon` : chaîne libre (le nom inconnu est un avertissement de `rules.ts`, D16/D37).
- `theme.light` et `theme.dark` : `z.strictObject` des 32 `THEME_TOKENS`, tous optionnels. Un token hors liste blanche donne `unknown_key`.
- `THEME_TOKENS` : `radius`, `background`, `foreground`, `card`, `card-foreground`, `popover`, `popover-foreground`, `primary`, `primary-foreground`, `secondary`, `secondary-foreground`, `muted`, `muted-foreground`, `accent`, `accent-foreground`, `destructive`, `border`, `input`, `ring`, `chart-1` … `chart-5`, `sidebar`, `sidebar-foreground`, `sidebar-primary`, `sidebar-primary-foreground`, `sidebar-accent`, `sidebar-accent-foreground`, `sidebar-border`, `sidebar-ring`. C'est exactement l'ensemble des variables du bloc `:root` de `src/index.css` (les `--color-*` et `--radius-*` de `@theme inline` n'en font pas partie).

## Issues (`issues.ts`)

`ConfigIssueCode` est une union littérale ; `ParamsOf<C>` associe à chaque code le type exact de ses paramètres, pour qu'un message ne puisse pas lire un paramètre absent.

**Codes structurels** (issues Zod converties, aucun texte Zod conservé) :

| Code | Paramètres |
|---|---|
| `json_syntax` | `line`, `column` (si extractibles de la position de l'erreur) |
| `unsupported_schema_version` | `found`, `supported` |
| `required` | — |
| `invalid_type` | `expected` |
| `unknown_key` | `key` |
| `invalid_enum` | `options` (liste jointe) |
| `not_integer` | — |
| `too_small` | `minimum` |
| `too_big` | `maximum` |
| `empty_string` | — |
| `invalid_css_shape` | — |
| `invalid_value` | — (repli pour tout code Zod non prévu) |

`unknown_key` : Zod regroupe les clés inconnues d'un objet en une issue ; la conversion émet **une issue par clé**, avec la clé en fin de chemin.

`json_syntax` : la ligne et la colonne sont calculées depuis la position (`at position N`) présente dans le message de `JSON.parse`, ou lues directement (`line X column Y`) selon le moteur ; absentes si rien n'est extractible.

**Codes des règles croisées.** Pour un doublon, le chemin désigne la seconde occurrence et `params` rappelle la première.

| Sévérité | Code | Paramètres | Règle |
|---|---|---|---|
| erreur | `duplicate_category_id` | `id`, `firstPath` | id de catégorie dupliqué |
| erreur | `duplicate_question_id` | `id`, `firstPath` | id de question dupliqué dans toute la config |
| erreur | `empty_scale` | — | barème vide |
| erreur | `negative_scale_value` | `value` | valeur négative dans un barème |
| erreur | `duplicate_scale_value` | `value` | doublon dans un barème |
| erreur | `zero_max_scale` | — | valeur maximale du barème égale à 0 |
| erreur | `category_without_questions` | — | catégorie sans question |
| erreur | `not_enough_questions` | `total`, `required` | total < `questionsPerStudent + (skips.enabled ? skips.maxPerStudent : 0)` (D06) |
| erreur | `missing_absent_value` | — | `absent.export = "value"` sans `absent.value` |
| erreur | `too_many_decimals` | `value` | valeur de notation (barème, `maxRawScore`, `finalScale`, `rounding.step`, `absent.value`) à plus de 3 décimales (D01) ; test `Math.round(v * 1000) / 1000 === v` |
| erreur | `invalid_css_value` | `property`, `value` | valeur refusée par `cssSupports` (`color` pour les couleurs, `border-radius` pour `radius`) (D15) |
| avertissement | `unreachable_max_score` | `reachable`, `maxRawScore` | `questionsPerStudent × max des barèmes` < `maxRawScore` |
| avertissement | `final_scale_off_grid` | `finalScale`, `step` | `finalScale` non multiple du pas d'arrondi (`step`, ou `10^-decimals`) (D20) |
| avertissement | `unknown_icon` | `icon` | nom absent de `iconsList` |

`formatPath(['categories', 2, 'questions', 5, 'id'])` → `categories[2].questions[5].id`.

`checkRules` reçoit `cssSupports` et `iconNames` (un `Set` construit depuis `iconsList` de `@tabler/icons-react`) en paramètres : testable sans navigateur ni Tabler. `validate.ts` construit le `Set` une fois. `iconsList` est un simple tableau de noms (`icons-list.mjs`, ~120 Ko bruts, ~20 Ko gzip) sans les composants : il n'entraîne pas le chunk d'icônes de D37.

## Normalisation (`normalize.ts`)

Appliquée seulement quand il n'y a aucune erreur. `NormalizedConfig` est un type déclaré explicitement : tous les champs sont requis sauf `locale`, `exam.subject`, `exam.cohort`, `absent.value`, `categories[].color`, `categories[].icon` et `questions[].answer`.

- Défauts du tableau §6.2 : `rounding` (`nearest`, 2, `null`), `absent` (`label`, `ABS`), `skips` (`true`, 1, `[]`, `true`), `presentation` (`true`, `both`, `false`, `true`, `system`), `theme` (`{ light: {}, dark: {} }`), `questions[].tags` (`[]`).
- `$schema` retiré.
- `locale` laissée absente si non fournie : la résolution par la langue du navigateur revient à F07 (F02 reste portable).
- Catégories **triées** par `order` puis par position dans le tableau, `order` réécrit en 1…n (D40). Deux `order` égaux ne sont pas une erreur.
- `title` absent → `deriveTitle(prompt)` (D41) :
  1. les blocs de code clôturés (```` ``` ````) sont ignorés ;
  2. la première ligne non vide restante est retenue ;
  3. markdown retiré : code en ligne gardé sans backticks, liens et images réduits à leur texte, `#` de titre, `>` de citation, marqueurs de liste, `*` et `_` d'emphase supprimés, espaces fusionnés ;
  4. coupure à 60 caractères sur une frontière de mot, suivie de `…` si le texte a été tronqué (coupure franche si le premier mot dépasse seul 60 caractères).

## Messages et i18n

- `src/i18n/` : `type Locale = 'fr' | 'en'`, `SUPPORTED_LOCALES`, `DEFAULT_LOCALE = 'fr'`, et un `t(locale, dict, key, params)` minimal. F07 l'étend (sélection de la langue, dictionnaires de l'UI).
- `src/config/messages.ts` : `Record<Locale, { [C in ConfigIssueCode]: (params: ParamsOf<C>) => string }>`. La complétude fr/en est garantie par le typage : `pnpm check` échoue si un code manque dans une langue.
- Le message de `unsupported_schema_version` invite explicitement à recharger la page pour mettre l'application à jour.

## JSON Schema (D17)

- `buildConfigJsonSchema()` (`src/config/json-schema.ts`) : `z.toJSONSchema(ConfigSchema, { target: 'draft-2020-12', io: 'input' })`, ajoute `$id` = `https://adriengras.github.io/questionator-z4000-hyperdrive/config.schema.json`, et remplace le nœud `icon` par `anyOf: [{ enum: iconNames }, { type: 'string' }]` (autocomplétion sans refus). Le plugin **et** le test ajv appellent cette même fonction.
- `vite/config-schema-plugin.ts` :
  - build : charge `src/config/json-schema.ts` via `runnerImport` de Vite, émet `config.schema.json` et `config.example.json` (copie de `examples/`) à la racine du bundle, donc servis sous la base Pages `/questionator-z4000-hyperdrive/` ;
  - dev : middleware servant les deux fichiers au même chemin ;
  - `examples/config.example.json` et `src/config/` ajoutés aux fichiers surveillés.
- README : courte section « Écrire une config » — le champ `$schema`, l'éditeur ne valide que la structure (les règles croisées sont vérifiées par l'application), lien vers l'exemple.

## Fichier d'exemple (D14)

`examples/config.example.json` : oral PHP réaliste, thème « Synthwave » complet de `PRODUCT.md` §6.2, `defaultColorMode: "dark"`, `questionsPerStudent: 3`, `skips.maxPerStudent: 2` (seuil de 5).

| Catégorie | Couleur | Barème | Questions | Icône |
|---|---|---|---|---|
| Facile | cyan `oklch(0.797 0.134 211.5)` | `[0, 0.5, 1]` | 5 | `leaf` |
| Normal | violet `oklch(0.709 0.159 293.5)` | `[0, 0.5, 1, 1.5, 2]` | 6 | `brand-php` |
| Difficile | magenta `oklch(0.687 0.252 323.9)` | `[0, 1, 2, 3]` | 4 | `flame` |
| Cauchemar | orange `oklch(0.758 0.159 55.9)` | `[0, 1, 2, 3, 4]` | 2 | `skull` |

Questions avec blocs de code `php`, éléments de réponse (`answer`) et `tags` ; au moins une question sans `title`, pour montrer la dérivation. L'exemple ne produit aucune erreur ni aucun avertissement.

## Tests (Vitest)

`cssSupports` est remplacé par un faux dans tous les tests.

- `issues.test.ts` : `formatPath` ; conversion de chaque code Zod ; une issue par clé inconnue ; repli `invalid_value` ; aucun message produit ne contient de texte Zod.
- `validate.test.ts` : `json_syntax` avec ligne et colonne ; pré-contrôle de version (seule issue renvoyée) ; `unknown_key` à la racine, dans une question et dans un thème ; `$schema` accepté ; avertissements seuls → `ok: true` ; erreurs structurelles → règles croisées non exécutées.
- `rules.test.ts` : **un test par code** de règle, erreurs et avertissements.
- `normalize.test.ts` : défauts appliqués ; tri par `order` et réécriture 1…n ; `locale` absente conservée.
- `derive-title.test.ts` : markdown retiré, bloc de code ignoré, coupure à 60 sur un mot avec `…`, premier mot trop long.
- `theme-tokens.test.ts` : `THEME_TOKENS` = ensemble des variables du bloc `:root` de `src/index.css`.
- `example.test.ts` : l'exemple passe `validateConfig` sans issue **et** valide le schéma de `buildConfigJsonSchema()` avec ajv.

## Critères d'acceptation

- [ ] Le fichier d'exemple passe la validation (Zod et JSON Schema).
- [ ] Chaque règle du §6.2 a un test qui la déclenche.
- [ ] Le JSON Schema publié valide le fichier d'exemple dans VSCode, avec autocomplétion des champs et des noms d'icônes.
- [ ] `config.schema.json` et `config.example.json` sont servis à la racine du site déployé.
- [ ] Toutes les issues ont un message en fr et en en (vérifié par le typage).
- [ ] Aucune issue ne porte de texte venant de Zod.

## Hors périmètre

- Appel de `validateConfig` et affichage des erreurs dans l'UI (F06).
- Application du thème, chunk d'icônes, sélection de la langue (F07).
- Migration de configs d'une version antérieure (aucune n'existe encore).
