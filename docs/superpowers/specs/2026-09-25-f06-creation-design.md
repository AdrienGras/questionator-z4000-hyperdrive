# F06 — Création de session — Design

- **Date** : 2026-09-25
- **Ticket** : [#6](https://github.com/AdrienGras/questionator-z4000-hyperdrive/issues/6)
- **Branche** : `feat/f06-creation`
- **Statut** : spec validée en conversation, figée ici avant le plan d'implémentation.

## Contexte

Une session naît d'un nom, d'une liste d'étudiants (CSV) et d'une config (JSON), figée dans la session à sa création. F06 remplit la route provisoire `/new` posée par F05 (D50) et réutilise son socle : `useUi` et le dictionnaire d'interface (D51), le chargement à la demande du validateur, les dialogues et le bandeau d'état de la base.

Références : [`PRODUCT.md`](https://github.com/AdrienGras/questionator-z4000-hyperdrive/blob/main/PRODUCT.md) §6.1, F06 · [`docs/DECISIONS.md`](https://github.com/AdrienGras/questionator-z4000-hyperdrive/blob/main/docs/DECISIONS.md) D11, D15, D18, D22, D25, D46, D50, D51, D54–D57.

## Objectif

Un écran de création (route `/new`) qui lit, valide et prévisualise le CSV et la config, puis crée la session et ouvre l'écran de passage (page provisoire tant que F09 n'est pas livrée).

## Écart avec le ticket

- Route `/new` et non `/session/new` (D54) : les liens de F05 sont définitifs, et une route fixe `/session/new` rendrait inaccessible une session d'`id` « new ».
- En-tête du CSV cherché dans les 5 premières lignes non vides, pas seulement la première (D55).
- Ajout d'un CSV d'exemple publié (D56).

## Dépendances à ajouter

- `papaparse` (dépendance) et `@types/papaparse` (dépendance de dev), versions stables courantes.

## Modules

```
src/students/                     pur : aucun React, aucune base
  header.ts                       normalizeHeaderCell(cell), classifyHeaderCell(cell) → 'lastName' | 'firstName' | undefined
  parse-csv.ts                    parseStudentsCsv(text) → CsvParseResult
  issues.ts                       CsvIssueParams, CsvIssue, csvError / csvWarning
  messages.ts                     CSV_ISSUE_MESSAGES fr/en, formatCsvIssue(issue, locale)
  index.ts                        réexports publics
src/sessions/
  build-session.ts                buildSession(input, deps) → Session
src/create/                       UI de la route /new
  CreateSessionPage.tsx           mise en page deux colonnes, useUi() une fois
  FileDropField.tsx               un fichier : sélection + glisser-déposer, nom, état, « Remplacer »
  StudentsPreview.tsx
  ConfigPreview.tsx
  use-create-form.ts              état du formulaire et des fichiers lus, validation, création
  default-session-name.ts         defaultSessionName(examTitle, now, locale)
src/components/DbStatusBanner.tsx bandeau `outdated` / `unavailable` extrait de l'accueil (F05), réutilisé
src/routes/new.tsx                CreateSessionPage à la place de ComingSoon
examples/students.example.csv     liste d'exemple (D56)
vite/config-schema-plugin.ts      publie aussi students.example.csv
```

Imports : `src/students/` et `src/sessions/` utilisent des imports relatifs vers `../domain`, `../config`, `../i18n`, `../app-version` ; ni React ni `@/db`. L'écriture passe par `createSession` et `requestPersistentStorage` de `@/db`.

## Lecture du CSV (`src/students/`, D25, D55)

```ts
type CsvStudent = { lastName: string; firstName: string; line: number }
type CsvParseResult = { students: CsvStudent[]; issues: CsvIssue[] }
```

1. **Parse** : PapaParse sur le texte, `header: false`, délimiteur détecté parmi `,` et `;` (`delimitersToGuess: [',', ';']`), lignes vides conservées pour garder les numéros de ligne ; BOM retiré avant le parse. Une erreur de PapaParse qui empêche la lecture (guillemet non fermé) produit `csv_syntax { line }` en erreur.
2. **Lignes utiles** : lignes dont au moins une cellule est non vide après trim. Numéro de ligne = position dans le fichier, base 1, lignes vides comprises.
3. **En-tête (D55)** : parmi les 5 premières lignes utiles, la première qui contient une cellule reconnue « nom » et une cellule reconnue « prénom ». Reconnaissance : cellule normalisée (NFD, diacritiques retirés, minuscules, espaces, tirets et underscores retirés) comparée aux formes normalisées de D25 — nom : `nom`, `nomdefamille`, `lastname`, `surname`, `familyname` ; prénom : `prenom`, `firstname`, `givenname`. Ordre libre. Les lignes utiles avant l'en-tête sont ignorées avec un avertissement unique `preamble_skipped { count }`. Sans en-tête : pas de préambule, toutes les lignes utiles sont des données, colonne 1 = nom, colonne 2 = prénom.
4. **Données** : pour chaque ligne après l'en-tête (ou toutes) :
   - nom et prénom trimés, casse conservée ;
   - un seul des deux non vide → ligne ignorée, `single_field_row { line }` ;
   - cellules non vides hors des deux colonnes → comptées ; avertissement unique `extra_columns { count }` (nombre de lignes concernées) ;
   - doublon (nom et prénom identiques après normalisation : trim, casse, diacritiques) → étudiant conservé, `duplicate_student { line, firstLine, name }` avec `name` = « Nom Prénom » tel qu'écrit.
5. **Aucun étudiant** → `no_students` en erreur (fichier vide, en-tête seul, lignes toutes ignorées).

Issues : `{ severity: 'error' | 'warning'; code; line?: number; params }`, sans texte (D18). `formatCsvIssue` traduit ; l'UI affiche « Ligne N : » quand `line` est défini.

| Code | Sévérité | Params |
|---|---|---|
| `csv_syntax` | erreur | `line` |
| `no_students` | erreur | — |
| `preamble_skipped` | avertissement | `count` |
| `single_field_row` | avertissement | `line` |
| `extra_columns` | avertissement | `count` |
| `duplicate_student` | avertissement | `line`, `firstLine`, `name` |

## CSV d'exemple (D56)

`examples/students.example.csv` : UTF-8 avec BOM, séparateur `;`, en-tête `Nom;Prénom`, une dizaine d'étudiants fictifs avec accents (ex. Lefèvre Chloé, Nguyễn Minh). Publié à la racine du site par `vite/config-schema-plugin.ts` (middleware en dev, `emitFile` au build), servi en `text/csv; charset=utf-8`, BOM conservé. Liens : sous le champ CSV de l'écran de création et dans l'état vide de l'accueil, à côté de la config d'exemple ; mentionné dans le README (« Usage prévu »).

## Construction de la session (`src/sessions/build-session.ts`)

```ts
type BuildSessionInput = {
  name: string
  examiner: string
  config: NormalizedConfig
  students: readonly { lastName: string; firstName: string }[]
}
type BuildSessionDeps = { newId: () => string; now: () => Date }
export function buildSession(input: BuildSessionInput, deps: BuildSessionDeps): Session
```

- `id` = `newId()` ; chaque étudiant reçoit aussi `newId()`.
- `name` trimé ; `examiner` trimé, clé omise si vide (D11).
- `createdAt` = `updatedAt` = `now().toISOString()` ; `appVersion` = `APP_VERSION`.
- `config` = l'objet normalisé renvoyé par `validateConfig` (jamais le texte source).
- Étudiants dans l'ordre du CSV : `order` à partir de 1, `addedDuringSession: false`, `absent: false`, `attempts: []`.
- `activeStudentId` = id du premier étudiant ; `projection: { mode: 'waiting' }`.
- Précondition : au moins un étudiant (sinon `Error`, l'UI ne l'appelle pas).

L'UI passe `newId: () => crypto.randomUUID()` et `now: () => new Date()`.

## Écran de création (route `/new`, D57)

### Mise en page

En-tête : lien « ← Accueil » (`/`), titre « Nouvelle session ». Deux colonnes sur écran large (`md:` et plus), empilées sur petit écran.

### Colonne gauche : formulaire

- **`FileDropField` × 2** : liste d'étudiants (`accept=".csv,text/csv"`) et config (`accept=".json,application/json"`). Bouton de sélection (input caché) et glisser-déposer sur la zone (premier fichier seulement ; `preventDefault` au `dragover` pour que le navigateur n'ouvre pas le fichier). Une fois chargé : nom du fichier, icône d'état (valide, avertissements, erreurs), bouton « Remplacer ». Un nouveau fichier remplace le précédent. Échec de `file.text()` → message d'erreur sur la zone.
- Liens de téléchargement de `students.example.csv` et `config.example.json` (`${import.meta.env.BASE_URL}…`, attribut `download`).
- **Nom de session** (obligatoire) : prérempli par `defaultSessionName(exam.title, now, locale)` = `<exam.title> — <Intl.DateTimeFormat(locale, { dateStyle: 'long' })>` dès qu'une config valide est chargée, **tant que l'utilisateur n'a pas modifié le champ**. Toute saisie manuelle (y compris vider le champ) désactive définitivement le préremplissage pour cet écran.
- **Examinateur** (facultatif), aide `examiner_hint`.
- **« Créer la session »** : désactivé si un fichier manque, si le CSV ou la config a une erreur, si le nom trimé est vide, si la base n'est pas `open`, ou pendant la création.

### Colonne droite : aperçu

- Sans fichier : texte d'aide court.
- **Étudiants** : nombre, liste repliable (`<details>`, « Nom Prénom » dans l'ordre), puis les issues CSV (erreurs d'abord), « Ligne N : message ».
- **Config** (si valide) : titre, matière, promo ; une ligne par catégorie (libellé, nombre de questions, barème) ; questions par étudiant, note brute max → note finale, arrondi (mode, pas ou décimales) ; skips (activés ou non, maximum par étudiant). Puis toutes les issues de F02 (erreurs d'abord), chacune avec `formatPath(path)` et `formatConfigIssue`. Config invalide : seules les issues sont affichées.

### Validation de la config

`validateConfig` chargé en `import('@/config/validate')` au premier fichier JSON (convention « Module lourd chargé à la demande ») ; échec du chargement → erreur sur la zone. Appel avec `{ cssSupports: (p, v) => CSS.supports(p, v) }` (D15).

### Création

1. `await requestPersistentStorage()` — à chaque création : idempotente, pas besoin de savoir si c'est la première session (D57).
2. `buildSession(...)` avec la config normalisée et les étudiants du CSV.
3. `await createSession(session)`.
4. Navigation vers `/session/$sessionId`.

Échec d'écriture (`SessionExistsError` improbable, IndexedDB bloquée) : message `write_error` sous le bouton, formulaire conservé, nouvel essai possible. Un échec de `requestPersistentStorage` ne bloque pas la création.

### État de la base

`DbStatusBanner` (extrait de `SessionList` de F05, même textes) affiché si `useDbStatus()` vaut `outdated` ou `unavailable` ; « Créer » désactivé dans ces deux cas.

### Dictionnaire

Nouvelles clés dans `UI_MESSAGES` (fr et en) pour tous les textes de l'écran ; `empty_students_example_link` ajouté à l'état vide de l'accueil.

## Tests (Vitest)

- **`parse-csv.test.ts`** : `;` + BOM + `Nom;Prénom` ; `,` sans en-tête (nom puis prénom) ; `First Name,Last Name` (ordre inversé) ; variantes d'en-têtes (`NOM`, `Prénom`, `nom de famille`, `given-name`, `Last_Name`) ; préambule de 2 lignes → `preamble_skipped { count: 2 }` ; en-tête en 6ᵉ ligne utile non reconnu ; colonnes en trop → avertissement unique ; ligne à un champ ignorée avec son numéro ; lignes vides ignorées mais comptées ; doublons (casse, accents) avec `firstLine` ; trim et casse conservée ; cellule entre guillemets contenant le séparateur ; CRLF ; guillemet non fermé → `csv_syntax` ; fichier vide et en-tête seul → `no_students`.
- **`students.example.csv`** : aucune issue, nombre d'étudiants attendu.
- **`messages.test.ts`** : chaque code en fr et en en.
- **`build-session.test.ts`** : ordre et `order`, `activeStudentId`, config = objet normalisé fourni, examinateur vide retiré, ids et dates injectés ; la session produite passe `SessionSchema` et `checkSessionRules` (sans issue).
- **`default-session-name.test.ts`** : fr et en.
- **Plugin Vite** : `students.example.csv` servi en dev (type `text/csv`) et émis au build.
- **Composants** (`fake-indexeddb`) : « Créer » désactivé sans fichier ; bloqué par une erreur de config, puis par une erreur CSV ; débloqué avec des avertissements seuls ; toutes les erreurs de config affichées avec leur chemin ; nom prérempli puis non réécrit après saisie manuelle, même avec une nouvelle config ; création → session en base conforme et navigation vers `/session/<id>` ; échec d'écriture → message, formulaire conservé ; bandeaux `outdated` / `unavailable` → « Créer » désactivé ; glisser-déposer ; config figée : charger une autre config après la création ne change pas la session en base.
- **Accueil** : l'état vide propose aussi la liste d'exemple.

## Vérification manuelle (à consigner dans la PR)

Build de prod + `vite preview` (voir QUIRKS sur le serveur de dev partagé), Chromium : création à partir des deux fichiers d'exemple ; CSV avec préambule et lignes anormales ; config invalide ; retour à l'accueil et carte présente. Vérifier que `pnpm build` n'affiche aucun avertissement de taille de chunk et que le chunk qui charge le validateur n'embarque pas les composants Tabler (seulement `iconsList`).

## Critères d'acceptation

- Un CSV séparé par `;` avec BOM et en-tête `Nom;Prénom` est importé correctement.
- Une config invalide bloque la création et affiche toutes les erreurs.
- Modifier ensuite le fichier de config n'a aucun effet sur la session.
- Une ligne CSV mal formée n'empêche pas la création et apparaît en avertissement dans l'aperçu.
- Après création, l'écran de passage (page provisoire) s'ouvre sur la session créée, premier étudiant actif.
- Toutes les chaînes de l'écran existent en français et en anglais.
- `pnpm check` vert ; SonarQube : quality gate OK, 0 issue, 0 hotspot.

## Hors périmètre

- Ajout d'étudiant en cours de session (F13).
- Thème de la config (F07), sélecteur de langue.
- Écran de passage réel (F09).
- Import de listes Excel (`.xlsx`) : CSV seulement (§6.1).
