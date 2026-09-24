# Conventions de code

Squelettes et patterns récurrents du projet. À consulter avant de créer un nouveau
type de fichier ou de composant.

Si tu découvres un pattern récurrent : documente-le ici.

Une section par pattern (`## <Nom du pattern> — squelette`), avec le code minimal
reproductible dans un bloc de code, suivi si besoin d'une sous-section
`### Règles tacites`.

---

## Message de commit — gitmoji

```
<emoji> <message court, au présent, en français>

<corps facultatif : le pourquoi, pas le quoi>

Refs #<issue>        (ou Closes #<issue> pour le commit qui la termine)
```

Exemple : `✨ Ajoute le tirage aléatoire d'une question par catégorie`

### Règles tacites

- Emoji en **Unicode**, jamais en `:shortcode:` : lisible dans `git log`, les terminaux
  et l'interface GitHub sans rendu.
- Un seul emoji, celui de l'intention principale. Si un commit en mériterait deux, c'est
  souvent qu'il faut le découper.
- Emojis les plus courants ici (liste complète : https://gitmoji.dev) :

| Emoji | Usage |
|---|---|
| 🎉 | Premier commit du projet |
| ✨ | Nouvelle fonctionnalité |
| 🐛 | Correction de bug |
| 📝 | Documentation, spec, mémoire projet |
| ✅ | Ajout ou mise à jour de tests |
| ♻️ | Refactoring sans changement de comportement |
| 🎨 | Structure ou format du code |
| 💄 | UI, styles |
| 🌐 | Internationalisation (chaînes fr/en) |
| 🔧 | Fichiers de configuration |
| 👷 | CI (GitHub Actions) |
| 🚀 | Déploiement |
| ⬆️ | Mise à jour de dépendances |
| ➕ / ➖ | Ajout / retrait d'une dépendance |
| 🔥 | Suppression de code ou de fichiers |
| 🗃️ | Schéma de base (Dexie) |
| 🦺 | Validation (schémas Zod) |
| 🚧 | Travail en cours (à éviter sur `main`) |

## Route TanStack (file-based) — squelette

```tsx
// src/routes/session.$sessionId.tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/session/$sessionId')({
  component: SessionPage,
})

function SessionPage() {
  const { sessionId } = Route.useParams()
  return <main>{sessionId}</main>
}
```

### Règles tacites

- Historique **par hash** (`createHashHistory` dans `src/main.tsx`) : les URL publiques sont `…/#/session/<id>`.
- Le routeur est créé par `createAppRouter(history)` (`src/router.tsx`) ; les tests passent `createMemoryHistory({ initialEntries: ['/…'] })`.
- Après ajout ou renommage d'une route : `pnpm test` (ou `pnpm dev`) régénère `src/routeTree.gen.ts` ; le **commiter** (voir QUIRKS).
- Les tests peuvent vivre dans `src/routes/` (`*.test.tsx`, ignorés par le plugin).

## Composant shadcn — ajout

```bash
corepack pnpm dlx shadcn@latest add <composant> -y
```

### Règles tacites

- shadcn v4, primitives base-ui, icônes Tabler (`@tabler/icons-react`), preset Nova (D37).
- Code vendu dans `src/components/ui/` : ignoré par oxlint, formaté par Prettier ; on peut le modifier, mais toute personnalisation doit rester compatible avec un `add --overwrite`.
- Un seul `cn`, dans `@/lib/utils`.
- Couleurs uniquement via les tokens CSS (`bg-primary`, `text-foreground`…), jamais de couleur en dur : le thème de session (F07) surcharge ces tokens.

## oxlint — règles configurées

- `import/no-unassigned-import` reste en erreur, avec une liste blanche pour les imports à effet de bord légitimes (`**/*.css`, `@testing-library/jest-dom/vitest`). Ajouter une entrée à `allow` dans `.oxlintrc.json` plutôt que désactiver la règle.
- Lint type-aware obligatoire (`--type-aware`) : une promesse non gérée est une erreur.

## Pull request — checklist avant « Ready for review »

```bash
git push -u origin <branche>
gh pr create --draft -B main -t "Fxx — …" -F corps.md     # avec « Closes #n »
gh pr checks <n> --watch                                   # job CI « check » vert
.claude/scripts/sonar-check.sh --pr <n> --wait             # quality gate OK, 0 issue, 0 hotspot
gh pr ready <n>
```

### Règles tacites

- Toujours ouvrir la PR en brouillon : SonarQube Cloud (analyse automatique) n'analyse que `main` et les PR, pas une branche poussée seule.
- Chaque issue Sonar est corrigée, pas marquée « won't fix », sauf accord explicite. Un fichier généré (ex. `src/routeTree.gen.ts`) s'exclut dans `.sonarcloud.properties`.
- Actions GitHub épinglées par **SHA de commit**, version en commentaire (`uses: owner/action@<sha> # vX.Y.Z`) — règle Sonar `githubactions:S7637`.
