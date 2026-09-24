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

## Développement

Prérequis : [nvm](https://github.com/nvm-sh/nvm) et pnpm (version fixée par `packageManager`).

```bash
nvm use
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
