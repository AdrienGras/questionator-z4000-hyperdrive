# F20 — Accueil sur deux colonnes — Design

- **Date** : 2026-10-01
- **Ticket** : [#54](https://github.com/AdrienGras/questionator-z4000-hyperdrive/issues/54)
- **Branche** : `feat/f20-accueil-deux-colonnes`
- **Statut** : design validé en conversation, figé ici avant le plan d'implémentation.

## Contexte

Retours des tests manuels V1. L'accueil (`HomePage`, `PageShell` depuis F19) met « Importer un backup » et « Créer une session » dans la barre de titre, puis la liste des sessions en une colonne. Les actions n'expliquent pas ce qu'elles font ; seul l'état vide renvoie vers les fichiers d'exemple. L'export Excel (F16) n'existe que dans la vue de passage (`ExportButton`, `features/session/`), que `features/home` ne peut pas importer (D59). La carte de session propose déjà « Exporter un backup » dans son menu « … ».

Références : [`PRODUCT.md`](https://github.com/AdrienGras/questionator-z4000-hyperdrive/blob/main/PRODUCT.md) F03, F05, F16 · `docs/DECISIONS.md` D35, D52, D59, D71, D75 · `docs/BACKLOG.md` § Export Excel (deux items → #54).

## Objectif

L'accueil est coupé en deux colonnes : à gauche les actions, en cartes horizontales descriptives ; à droite les sessions, chacune exportable en Excel depuis son menu.

## Décisions (D78)

| Sujet | Décision | Raison |
|---|---|---|
| Ce qui est partagé | `exportWorkbook` et un hook `useWorkbookExport` dans `src/components/export/` ; `ExportButton` reste dans `features/session/` et consomme le hook | L'export Excel de la carte est un item de menu (choix utilisateur) : le menu se ferme au clic, le bouton et son alerte ne s'y réutilisent pas. Ce que les deux features partagent est la logique (garde, état, échec), pas le bouton. Une seule feature utilise encore `ExportButton` (D59, règle 4). Écart assumé avec le ticket (« `ExportButton` déplacé »). |
| Garde double clic | `useRef<boolean>` lu et écrit dans `run`, jamais pendant le rendu | Item BACKLOG : deux clics dans le même tick passaient tous deux la garde sur l'état du rendu. |
| Export sur la carte | Item « Exporter en Excel » dans le menu « … », juste sous « Exporter un backup » ; désactivé et libellé « Export… » pendant l'export ; échec → alerte `role="alert"` dans le contenu de la carte, effacée au prochain lancement | Choix utilisateur (menu plutôt que bouton visible). |
| Colonnes | `lg:grid-cols-[24rem_minmax(0,1fr)]` ; sous `lg`, empilées, actions d'abord ; liste de sessions sur deux colonnes à partir de `2xl` | Colonne d'actions de largeur stable ; à 1536 px, une carte de session sur une colonne ferait ~1100 px. |
| Barre de titre | Ne garde que l'alerte de persistance, puis le thème | Créer et importer deviennent les cartes de gauche. |
| Cartes d'action | Deux cartes horizontales (icône, titre `h3`, texte, liens, bouton) dans une `section` intitulée « Actions » (`h2` `sr-only`) | Le ticket demande des cartes qui disent ce qu'elles font et ce qu'elles attendent. |
| État vide | Titre « Aucune session » + une phrase qui renvoie aux actions ; plus de boutons ni de liens | Doublon des cartes de gauche, juste à côté. |
| Hors ligne | Rien à ajouter : `config.example.json`, `students.example.csv` et `config.schema.json` sont déjà pré-cachés (`globPatterns` `**/*.{…,json,csv,…}`, F17) | Critère « y compris hors ligne ». |

## Architecture

### `src/components/export/export-workbook.ts` (déplacé)

Depuis `src/features/session/export-workbook.ts`, contenu inchangé (`import()` dynamique de `@/lib/xlsx/write-workbook`, D71).

### `src/components/export/use-workbook-export.ts` (nouveau)

```ts
export type WorkbookExportState = 'idle' | 'busy' | 'failed'
export function useWorkbookExport(locale: Locale): {
  state: WorkbookExportState
  run: (session: Session) => Promise<void>
}
```

`run` : sort si le ref `running` est vrai ; sinon le pose, `state = 'busy'`, `await exportWorkbook(session, locale)`, `state = 'idle'` (ou `'failed'` si rejet), remet le ref à faux dans un `finally`.

### `src/features/session/components/export-button.tsx`

Consomme `useWorkbookExport(ui.locale)` ; rendu et libellés inchangés.

### `src/features/home/components/session-card.tsx`

- `const excel = useWorkbookExport(locale)`.
- Item de menu `excel.state === 'busy' ? export_busy : export_button`, `disabled={excel.state === 'busy'}`, `onClick={() => void excel.run(session)}`, placé après « Exporter un backup ».
- Dans `CardContent`, si `excel.state === 'failed'` : `<p role="alert" className="text-sm text-destructive">{export_error}</p>`.

### `src/features/home/components/action-cards.tsx` (nouveau)

```tsx
export function ActionCards({ ui, storageAvailable, importDisabled, onImport }: Readonly<{
  ui: Ui; storageAvailable: boolean; importDisabled: boolean; onImport: () => void
}>)
```

- `section aria-labelledby` → `h2 sr-only` « Actions » (`home_actions_title`).
- Carte « Nouvelle session » (`IconPlus`) — masquée si `!storageAvailable` :
  - texte `home_create_body` : fr « Partez d'une liste d'étudiants (CSV nom / prénom) et d'un fichier de configuration (JSON : catégories, questions, barèmes). » ; en « Start from a student list (CSV, last name / first name) and a configuration file (JSON: categories, questions, scales). »
  - liens : `students.example.csv` (`download`, `home_students_example_link`, reprend le texte de `empty_students_example_link`), `config.example.json` (`download`, `home_config_example_link`, reprend `empty_example_link`), `config.schema.json` (`target="_blank" rel="noreferrer"`, `home_config_schema_link` : fr « JSON Schema de la config », en « Config JSON Schema »). URL : `${import.meta.env.BASE_URL}<fichier>`.
  - bouton : lien `/new` stylé bouton, `home_create`.
- Carte « Restaurer une session » (`IconFileImport`) :
  - texte `home_import_body` : fr « Restaurez une session à partir d'un fichier .json créé par « Exporter un backup ». Vous pouvez aussi déposer le fichier n'importe où sur la page. » ; en « Restore a session from a .json file made with “Export a backup”. You can also drop the file anywhere on the page. »
  - bouton `home_import`, `disabled={importDisabled}`, `onClick={onImport}`.
- Titres des cartes : `home_create_title` (fr « Nouvelle session », en « New session »), `home_import_title` (fr « Restaurer une session », en « Restore a session »), en `h3`.
- Disposition d'une carte : `Card` shadcn, contenu `flex gap-4` (icône `size-8 shrink-0 text-primary`, puis colonne titre / texte / liens / bouton).

### `src/features/home/components/home-actions.tsx`

Ne rend plus que l'alerte de persistance (import et création retirés ; props `storageAvailable`, `importDisabled`, `onImport` supprimées). Renommage éventuel laissé tel quel.

### `src/features/home/components/empty-state.tsx`

`Card` avec `empty_title` (h2) et `empty_body` réécrit : fr « Créez une session ou importez un backup depuis les actions. » ; en « Create a session or import a backup from the actions. » Plus de props `onImport`, plus de boutons ni de liens. Les clés `empty_example_link` et `empty_students_example_link` sont supprimées (remplacées par les clés `home_*_example_link`).

### `src/features/home/components/session-list.tsx`

`ul` en `grid gap-4 2xl:grid-cols-2` ; plus de prop `onImport`.

### `src/features/home/home-page.tsx`

Enfant de `PageShell` : `div` `flex flex-col gap-6 lg:grid lg:grid-cols-[24rem_minmax(0,1fr)] lg:items-start`, avec `ActionCards` puis une `section` (`aria-labelledby` → `h2 sr-only` « Sessions », `home_sessions_title`) contenant `SessionList`. `ImportController` enveloppe toujours toute la page (glisser-déposer inchangé).

## Tests (Vitest)

- `use-workbook-export.test.ts` : `exportWorkbook` simulé ; deux `run` dans le même tick → un seul appel ; `busy` pendant, `idle` après succès, `failed` après rejet, un nouveau `run` après échec repasse par `busy`.
- `export-button.test.tsx` : mock déplacé sur `@/components/export/export-workbook` ; assertions inchangées.
- `home-page.test.tsx` :
  - barre de titre : seul le thème (et l'alerte en best-effort) ; plus de « Créer » / « Importer ».
  - cartes d'action : `region` « Actions » ; lien « Créer une session » → `/new` ; trois liens (`href` se terminant par `students.example.csv`, `config.example.json` avec `download`, `config.schema.json` avec `target="_blank"`) ; bouton « Importer un backup » actif, désactivé en `outdated` / `unavailable` ; carte de création absente en `unavailable`.
  - état vide : titre et phrase, aucun lien de téléchargement dans la `region` « Sessions ».
  - liste triée : les titres de session lus dans la `region` « Sessions » (les cartes d'action ont aussi des titres).
  - export Excel depuis le menu : `exportWorkbook` simulé appelé avec la session et `'fr'` ; item désactivé pendant l'export ; alerte d'échec.
- Même fichier que la vue examinateur : les deux chemins appellent `exportWorkbook(session, ui.locale)` (assertion d'appel identique dans les deux tests).
- `import-controller.test.tsx` : inchangé (glisser-déposer).
- `check:bundle` : l'accueil n'embarque toujours pas `write-excel-file`.

## Vérification visuelle (à consigner dans la PR)

`pnpm dev` à 1440 px et 900 px : colonnes côte à côte puis empilées (actions d'abord) ; export Excel depuis une carte ; onglet réseau : chunk `write-workbook` chargé seulement au clic. `pnpm build && pnpm preview` hors ligne : les trois liens d'exemple répondent.

## Documentation

- `docs/DECISIONS.md` : D78.
- `PRODUCT.md` : F03 (accueil) et F16 (export depuis l'accueil).
- `docs/INDEX.md`, `docs/BACKLOG.md` (deux items → #54 cochés), `docs/HANDOFF.md`.

## Critères d'acceptation

- [ ] Deux colonnes côte à côte à partir de 1024 px, empilées en dessous (actions d'abord).
- [ ] Chaque carte d'action dit ce qu'elle fait et ce qu'elle attend comme fichier.
- [ ] Les liens d'exemple téléchargent les fichiers publiés, y compris hors ligne.
- [ ] L'export depuis la carte de session produit le même fichier que depuis la vue examinateur.
- [ ] L'accueil ne charge pas la bibliothèque d'export avant le clic.
- [ ] Import par bouton et par glisser-déposer inchangés.

## Hors périmètre

- Export groupé de plusieurs sessions.
