# Questionator Z-4000 Hyperdrive

![Questionator Z-4000 Hyperdrive](banner.webp)

Application web pour faire passer des oraux notés par tirage de questions. L'étudiant choisit une catégorie de difficulté, l'application tire une question au hasard, l'examinateur note, et le score cumulé est affiché après chaque question.

Tout tourne dans le navigateur : aucune donnée ne quitte la machine de l'examinateur.

**Application :** https://adriengras.github.io/questionator-z4000-hyperdrive/

> Projet en cours de construction. La spécification complète est dans [`PRODUCT.md`](PRODUCT.md).

## Usage prévu

1. Préparer une liste d'étudiants (CSV nom / prénom) et un fichier de configuration (JSON : catégories, questions, barèmes).
2. Créer une session dans l'application à partir de ces deux fichiers.
3. Faire passer chaque étudiant, avec une vue projetée pour l'étudiant et une vue de pilotage pour l'examinateur.
4. Exporter les résultats en Excel.

## Écrire une config

Partir du [fichier d'exemple](https://adriengras.github.io/questionator-z4000-hyperdrive/config.example.json) (aussi dans [`examples/config.example.json`](examples/config.example.json)). Sa première ligne pointe vers le JSON Schema publié :

```json
"$schema": "https://adriengras.github.io/questionator-z4000-hyperdrive/config.schema.json"
```

VSCode et les éditeurs compatibles en tirent l'autocomplétion des champs et des noms d'icônes [Tabler](https://tabler.io/icons). L'éditeur ne vérifie que la structure ; les règles croisées (identifiants uniques, barèmes, nombre de questions, couleurs…) sont vérifiées par l'application à la création de session. Le format complet est décrit dans [`PRODUCT.md`](PRODUCT.md) §6.2.

## Développement

Prérequis : [nvm](https://github.com/nvm-sh/nvm) et pnpm (version fixée par `packageManager`). Activer corepack avant l'installation (Node 24 le fournit ; avec un pnpm global plus ancien, préfixer chaque commande par `corepack pnpm …`).

```bash
nvm use
corepack enable
pnpm install
pnpm dev        # serveur de développement
pnpm check      # format, lint, types, tests (comme la CI, hors build)
pnpm build      # build de production dans dist/
```

## Conventions

- Commits en [gitmoji](https://gitmoji.dev), message en français (voir [`docs/CONVENTIONS.md`](docs/CONVENTIONS.md)).
- Une branche et une pull request par ticket, `Closes #n` dans la PR ; la CI doit être verte.

## Licence

[MIT](LICENSE)
