# F05 — Accueil et gestion des sessions — Design

- **Date** : 2026-09-25
- **Ticket** : [#5](https://github.com/AdrienGras/questionator-z4000-hyperdrive/issues/5)
- **Branche** : `feat/f05-accueil`
- **Statut** : spec validée en conversation, figée ici avant le plan d'implémentation.

## Contexte

Point d'entrée de l'application : retrouver ses sessions, les gérer, et les sauvegarder hors du navigateur (cache vidé, changement de machine). F05 est la première feature avec une vraie UI : elle pose le dictionnaire d'interface fr/en, la détection de la langue du navigateur et les premiers composants shadcn de dialogue, que F06 et les suivantes réutiliseront.

F05 passe avant F06 : l'import de backup suffit à remplir la base pour éprouver l'accueil, et F06 trouvera un socle d'UI prêt (arbitrage de session, D50).

Références : [`PRODUCT.md`](https://github.com/AdrienGras/questionator-z4000-hyperdrive/blob/main/PRODUCT.md) F05, F07 · [`docs/DECISIONS.md`](https://github.com/AdrienGras/questionator-z4000-hyperdrive/blob/main/docs/DECISIONS.md) D09, D11, D18, D22, D24, D28, D37–D39, D45–D47, D48–D52.

## Objectif

Un écran d'accueil (route `/`) qui liste les sessions et porte toutes les actions de gestion, dont un backup JSON exportable et réimportable sans perte, revalidé entièrement à l'import.

## Dépendances à ajouter

Aucune dépendance npm. Composants shadcn (code vendu dans `src/components/ui/`) : `dialog`, `alert-dialog`, `dropdown-menu`, `tooltip`, `input`, `label`, `card`, `progress`.

## Modules

```
src/domain/schema.ts        SessionSchema (Zod), config en z.unknown() ; test de typage contre Session
src/backup/
  envelope.ts               BACKUP_FORMAT = 'questionator-backup', BACKUP_FORMAT_VERSION = 1, BackupEnvelope
  serialize.ts              serializeBackup(session, now), backupFileName(session, now)
  parse.ts                  parseBackup(text, deps) → BackupParseResult
  rules.ts                  checkSessionRules(session) → BackupIssue[] (règles croisées, D48)
  issues.ts                 BackupIssueParams, BackupIssue, backupError
  messages.ts               BACKUP_ISSUE_MESSAGES fr/en, formatBackupIssue(issue, locale)
  download.ts               downloadText(fileName, text) : seul code DOM du module
  index.ts                  réexports publics
src/i18n/
  browser-locale.ts         detectBrowserLocale(languages) → Locale ; useBrowserLocale()
  ui-messages.ts            UI_MESSAGES fr/en (Dictionary), clés de l'accueil et des routes provisoires
src/home/
  progress.ts               sessionProgress(session) → { done, absent, remaining, total }
  HomeHeader.tsx            titre, indicateur de persistance, Importer, Créer
  SessionList.tsx           états (outdated, unavailable, chargement, vide, liste)
  SessionCard.tsx           carte + menu d'actions
  EmptyState.tsx
  RenameDialog.tsx          renommer / modifier l'examinateur (un composant, deux usages)
  DeleteDialog.tsx          AlertDialog avec « Exporter un backup d'abord »
  ImportController.tsx      input caché, glisser-déposer, dialogues d'erreur et de conflit
  export-session.ts         exportSession(session) = serializeBackup + backupFileName + downloadText
src/routes/
  index.tsx                 accueil
  new.tsx                   provisoire « Bientôt disponible » (F06 la remplira)
  session.$sessionId.tsx    provisoire « Bientôt disponible » (F09 la remplira)
```

Imports : `src/backup/` importe `@/domain`, `@/config` (validateur, `parseJson`, `fromZodIssues`, `formatConfigIssue`) et `@/i18n` ; il n'importe ni `@/db` ni React. L'écriture en base reste dans `src/home/` via l'API publique de `@/db`.

## Version de l'application

`vite.config.ts` lit `package.json` et déclare `define: { __APP_VERSION__: JSON.stringify(version) }` ; `src/vite-env.d.ts` déclare `const __APP_VERSION__: string`. Vitest applique le même `define`. `src/app-version.ts` exporte `APP_VERSION = __APP_VERSION__` : seul point de lecture.

## Schéma de session (`src/domain/schema.ts`)

`SessionSchema` décrit `Session` (§7, D43) en `z.strictObject` à tous les niveaux, comme la config (D05) :

- dates (`createdAt`, `updatedAt`, `drawnAt`, `editedAt`, `finalRevealedAt`) : `z.iso.datetime()` ;
- `id`, `name`, `lastName`, `firstName`, `categoryId`, `questionId` : chaînes non vides ;
- `order` : entier ; `score`, `adjustment.value` : nombres finis ;
- `outcome` : `z.enum(['pending', 'scored', 'skipped'])` ;
- `projection` : `{ mode: 'waiting' | 'student', studentId? }` ;
- `config` : `z.unknown()`, validé ensuite par F02 (étape 4 ci-dessous).

La cohérence interne d'un attempt (`score` présent si et seulement si `scored`, etc.) relève des règles croisées, pas du schéma : un seul endroit pour la logique métier, des issues avec chemin précis.

Test de typage : `z.infer<typeof SessionSchema>` avec `config` remplacé par `NormalizedConfig` est mutuellement assignable à `Session` (assertion `Equal<…>` dans `schema.test.ts`). Un champ ajouté à `Session` sans le schéma casse `tsc`.

## Backup (`src/backup/`, D24, D48, D49)

### Enveloppe

```json
{
  "format": "questionator-backup",
  "formatVersion": 1,
  "appVersion": "0.1.0",
  "exportedAt": "2026-09-25T14:00:00.000Z",
  "session": {}
}
```

`serializeBackup(session, now = new Date())` renvoie `JSON.stringify(envelope, null, 2)` suivi d'un saut de ligne. `session` est écrite telle quelle.

`backupFileName(session, now)` : `<slug>-backup-<AAAA-MM-JJ>.json`, date **locale** de `now`. Slug : `name` normalisé NFD, diacritiques retirés, minuscules, toute suite de caractères hors `[a-z0-9]` remplacée par `-`, tirets de bord retirés, tronqué à 60 caractères (sans tiret final) ; `session` si le résultat est vide.

### Issues (D18)

`BackupIssue = ConfigIssue | BackupRuleIssue`, discriminées par `code` (aucun code partagé). Les issues génériques de F02 (`json_syntax`, `required`, `invalid_type`, `unknown_key`, `invalid_enum`, `too_small`, `empty_string`…) sont réutilisées telles quelles pour le JSON, l'enveloppe et la session ; les issues de la config figée sont celles de F02, **chemin préfixé par `['session', 'config']`**. Tous les chemins partent donc de la racine du fichier.

Codes propres au backup (`BackupIssueParams`) :

| Code | Params | Cas |
|---|---|---|
| `unknown_format` | — | pas un objet, ou `format` absent ou différent |
| `unsupported_format_version` | `found`, `supported` | `formatVersion` entier > 1 (issue unique, comme D39) |
| `unknown_category` | `categoryId` | attempt vers une catégorie absente de la config |
| `unknown_question` | `categoryId`, `questionId` | attempt vers une question absente de sa catégorie |
| `score_not_in_scale` | `score`, `scale` (texte) | `score` hors barème de la catégorie |
| `score_mismatch` | `outcome` | `score` absent sur `scored`, ou présent sur un autre `outcome` |
| `skip_reason_mismatch` | — | `skipReason` présent hors `skipped` |
| `multiple_pending` | `count` | plus d'un attempt `pending` pour un étudiant (D28) |
| `absent_with_attempts` | — | étudiant absent avec des attempts (D08 les réinitialise) |
| `duplicate_student_id` | `id`, `firstPath` | |
| `duplicate_attempt_id` | `id`, `firstPath` | unicité sur toute la session |
| `unknown_active_student` | `studentId` | `activeStudentId` inconnu |
| `unknown_projected_student` | `studentId` | `projection.studentId` inconnu |
| `projection_mismatch` | — | `mode: 'student'` sans `studentId`, ou `studentId` avec `mode: 'waiting'` |

Toutes les issues de backup sont des erreurs. `formatBackupIssue(issue, locale)` délègue les `ConfigIssue` à `formatConfigIssue` et traduit les autres via `BACKUP_ISSUE_MESSAGES` ; le chemin est affiché avec `formatPath`.

### `parseBackup(text, { cssSupports })`

```ts
type BackupParseResult = { ok: true; session: Session } | { ok: false; issues: BackupIssue[] }
```

Étapes, chacune arrêtant la chaîne si elle produit une erreur :

1. **JSON** : `parseJson(text)` de F02 (BOM, position d'erreur).
2. **Format** : pas un objet ou `format !== 'questionator-backup'` → `[unknown_format]`. `formatVersion` entier > `BACKUP_FORMAT_VERSION` → `[unsupported_format_version]` seule.
3. **Enveloppe et session** : `BackupEnvelopeSchema` (`strictObject` : `format`, `formatVersion: z.literal(1)`, `appVersion` non vide, `exportedAt` ISO, `session: SessionSchema`), issues via `fromZodIssues`.
4. **Config figée** : `validateConfig(JSON.stringify(session.config), { cssSupports })`. Échec → ses issues d'erreur, chemin préfixé. Un `schemaVersion` futur ressort ici en issue unique (D39). Les avertissements de F02 sont ignorés : la config a été acceptée à la création.
5. **Règles croisées** : `checkSessionRules({ ...session, config: validated.config })` ; toutes les issues sont collectées (pas d'arrêt à la première).

Succès → `{ ok: true, session: { ...session, config: validated.config } }` : **la config stockée est celle que renvoie le validateur** (D49). `normalize` étant idempotent, un backup produit par l'app ressort strictement identique ; un backup retouché à la main (catégories désordonnées, défauts omis) retrouve la forme canonique. `updatedAt`, `createdAt` et `appVersion` de la session sont conservés.

`parseBackup` est pure : aucune écriture, aucun accès au DOM (`cssSupports` injecté, D15).

## Langue et dictionnaire d'interface (D51)

- `detectBrowserLocale(languages: readonly string[])` : première entrée dont le sous-tag primaire (`fr-CA` → `fr`) est une `Locale` ; sinon `DEFAULT_LOCALE`. `useBrowserLocale()` lit `navigator.languages` (repli `[navigator.language]`) une fois.
- `UI_MESSAGES: Record<Locale, Dictionary<UiMessageParams>>` dans `src/i18n/ui-messages.ts`, lu avec `t()`. Toutes les chaînes de l'accueil et des routes provisoires y passent, en fr et en en ; la page 404 existante aussi. F07 étendra ce dictionnaire et ajoutera `config.locale` pour les routes de session.
- Dates : `Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' })`.

## Accueil (route `/`, D52)

### En-tête

Titre de l'application ; à droite : indicateur de persistance, `[Importer un backup]`, `[Créer une session]` (lien vers `/new`).

Indicateur : icône Tabler `alert-triangle` avec `Tooltip`, rendue seulement si `usePersistenceStatus() === 'best-effort'`. Texte : le navigateur peut effacer les sessions en cas de manque d'espace ; exporter régulièrement un backup. Rien pour `persisted`, `unsupported` ni `undefined`.

### États de la liste (par priorité)

1. `useDbStatus() === 'outdated'` : bandeau « L'application a été mise à jour dans un autre onglet. Rechargez la page. » avec bouton Recharger ; ni liste ni import.
2. `useDbStatus() === 'unavailable'` : message « Stockage local indisponible (navigation privée ou cookies bloqués ?) » ; ni liste ni import, `[Créer]` masqué.
3. `useSessions() === undefined` : rien (chargement quasi instantané, pas de squelette).
4. `[]` : état vide avec `[Créer une session]`, `[Importer un backup]` et un lien de téléchargement du fichier d'exemple (`${import.meta.env.BASE_URL}config.example.json`, attribut `download`).
5. Sinon : une carte par session, dans l'ordre de `useSessions()` (`updatedAt` décroissant).

### Carte

- Nom (titre), `config.exam.title`, « Jury : <examiner> » si présent.
- « Modifiée le <date> ».
- Barre d'avancement (`done / total`) et « X passés · Y absents · Z restants ».
- `[Reprendre]` : lien vers `/session/$sessionId`.
- Menu `⋯` (`DropdownMenu`) : Renommer · Modifier l'examinateur · Exporter un backup · séparateur · Supprimer (style destructif).

### Avancement (`sessionProgress`)

Via `studentStatus` de F03 : `done` → passés, `absent` → absents, `todo` et `in_progress` → restants ; `total` = nombre d'étudiants. Un étudiant en cours compte comme restant (D52).

### Actions

| Action | Comportement |
|---|---|
| Renommer | `Dialog`, champ prérempli, validation désactivée si le nom trimé est vide ; `updateSession(id, s => ({ ...s, name: trimmed }))` |
| Modifier l'examinateur | Même dialogue, champ facultatif ; valeur trimée vide → clé `examiner` retirée (D11) |
| Exporter un backup | `exportSession(session)`, synchrone, sans dialogue |
| Supprimer | `AlertDialog` « Supprimer « <nom> » ? Cette action est définitive. » ; `[Exporter un backup d'abord]` télécharge et **laisse le dialogue ouvert** ; `[Annuler]` ; `[Supprimer]` destructif → `deleteSession(id)` |

Erreur d'écriture (`SessionNotFoundError` si la session a été supprimée dans un autre onglet, erreur Dexie) : message dans le dialogue, qui reste ouvert. Pour l'export depuis le dialogue de suppression, la session affichée suffit (lecture seule).

### Import

Entrées : `[Importer un backup]` (input `type=file` caché, `accept=".json,application/json"`) ou glisser-déposer d'un fichier n'importe où sur l'accueil (surimpression « Déposez le backup ici » pendant le survol ; un seul fichier, le premier si plusieurs). Désactivé en `outdated` et `unavailable`.

1. `await file.text()` puis `parseBackup(text, { cssSupports: (p, v) => CSS.supports(p, v) })`.
2. Échec → `Dialog` d'erreur : nom du fichier, liste de toutes les issues (`formatBackupIssue`, chemin), **aucune écriture**.
3. Succès → `getSession(session.id)` :
   - absente : `putSession(session)` ; la carte apparaît en tête via `useLiveQuery` ;
   - présente : `AlertDialog` « Une session « <nom existant> » (modifiée le <date>) porte le même identifiant. La remplacer par « <nom importé> » ? » ; `[Remplacer]` → `putSession`, `[Annuler]` → rien.
4. Erreur de lecture du fichier ou d'écriture : message dans le dialogue.

Pas de toast (aucune dépendance ajoutée) : l'apparition de la carte suffit comme retour.

## Routes provisoires (D50)

`/new` et `/session/$sessionId` affichent « Bientôt disponible » et un lien de retour à l'accueil, via `UI_MESSAGES`. F06 et F09 remplaceront leur composant ; les liens de F05 sont définitifs.

## Tests (Vitest)

- **`schema.test.ts`** : session complète acceptée ; champ manquant, type faux, clé inconnue, date non ISO refusés ; test de typage `Equal`.
- **`serialize.test.ts`** : enveloppe (format, version, `appVersion` = `APP_VERSION`, `exportedAt`) ; `backupFileName` : accents, espaces, ponctuation, longueur, repli `session`, date locale.
- **`parse.test.ts`** :
  - aller-retour : `parseBackup(serializeBackup(s))` égale `s` pour une session riche (scored, skipped avec motif, pending, ajustement avec motif, commentaire, absent, `finalRevealedAt`, `activeStudentId`, projection sur un étudiant, `examiner`) ;
  - refus, chacun avec son code : JSON invalide, `format` inconnu, pas un objet, `formatVersion` futur (issue unique), clé inconnue dans l'enveloppe, session invalide, config invalide (chemin préfixé), `schemaVersion` futur (issue unique) ;
  - config désordonnée → ressort normalisée ;
  - avertissements de config ignorés.
- **`rules.test.ts`** : un test par code de règle croisée, plus une session valide sans issue ; collecte de plusieurs issues.
- **`messages.test.ts`** : chaque code de `BackupIssueParams` produit un texte non vide en fr et en en ; délégation des `ConfigIssue`.
- **`browser-locale.test.ts`**, **`progress.test.ts`**, **`ui-messages.test.ts`** (toutes les clés dans les deux langues).
- **Composants** (Testing Library, `fake-indexeddb`, `downloadText` mocké) :
  - état vide ; liste triée ; indicateur visible seulement en `best-effort` ; bandeaux `outdated` et `unavailable` ;
  - renommer et modifier l'examinateur écrivent en base ; nom vide refusé ; examinateur vidé → clé retirée ;
  - supprimer : Annuler ne change rien, Supprimer vide la base, « Exporter d'abord » appelle `downloadText` et laisse le dialogue ouvert ;
  - import : fichier invalide → erreurs affichées et base inchangée ; nouvel `id` → session écrite ; conflit → Remplacer écrase, Annuler ne change rien.
- **Routes** : `/new` et `/session/x` rendent la page provisoire.

## Vérification manuelle (à consigner dans la PR)

Dans Chromium (`pnpm dev`, Playwright MCP) : importer un backup de fixture, renommer, exporter, supprimer, réimporter le fichier exporté et comparer ; vérifier le glisser-déposer et l'affichage en anglais (langue du navigateur). En parallèle, contrôler le point resté en suspens depuis F04 : survie des données à un vrai redémarrage du navigateur.

## Critères d'acceptation

- Un backup exporté puis importé dans un autre navigateur restitue une session identique, passages et ajustements compris.
- Un backup corrompu, incohérent ou d'un format inconnu affiche une erreur explicite et ne modifie rien.
- La suppression demande confirmation et propose d'exporter un backup d'abord.
- L'indicateur n'apparaît que si le stockage persistant est refusé.
- Toutes les chaînes de l'accueil existent en français et en anglais.
- `pnpm check` vert ; SonarQube : quality gate OK, 0 issue, 0 hotspot.

## Hors périmètre

- Duplication de session, import « comme copie » (hors V1).
- Création de session (F06), écran de passage (F09).
- Sélecteur de langue, `config.locale`, thème de session (F07).
- Tests e2e Playwright en CI (D33, plus tard).
