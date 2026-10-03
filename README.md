# Questionator Z-4000 Hyperdrive

![Animation du principe : un étudiant choisit une difficulté, une question est tirée et projetée sur grand écran, il répond à l'oral pendant que l'examinateur voit la réponse attendue et note sur son ordinateur ; puis on consulte les statistiques et on exporte un fichier Excel.](assets/readme-hero.svg)

Application web pour faire passer des oraux notés par tirage de questions. L'étudiant choisit une catégorie de difficulté, l'application tire une question au hasard, l'examinateur note, et le score cumulé est affiché après chaque question.

Tout tourne dans le navigateur : aucune donnée ne quitte la machine de l'examinateur.

**Application :** https://adriengras.github.io/questionator-z4000-hyperdrive/

**Documentation :** https://adriengras.github.io/questionator-z4000-hyperdrive/docs/

> Projet en cours de construction. La spécification complète est dans [`PRODUCT.md`](PRODUCT.md).

## Usage prévu

1. Préparer une liste d'étudiants (CSV nom / prénom, partir du [fichier d'exemple](https://adriengras.github.io/questionator-z4000-hyperdrive/students.example.csv), aussi dans [`examples/students.example.csv`](examples/students.example.csv)) et un fichier de configuration (JSON : catégories, questions, barèmes).
2. Créer une session dans l'application à partir de ces deux fichiers.
3. Faire passer chaque étudiant, avec une vue projetée pour l'étudiant et une vue de pilotage pour l'examinateur.
4. Exporter les résultats en Excel.

## Hors ligne et installation

Après un premier chargement en ligne, l'application fonctionne sans réseau : créer une session, faire passer, projeter, exporter. Elle s'installe comme une application (Chrome, Edge : icône d'installation dans la barre d'adresse). Quand une nouvelle version est publiée, un bouton « Recharger » la propose ; elle n'est jamais appliquée d'office. Seule exception hors ligne : une image distante dans une question (URL externe) ne s'affiche pas.

## Écrire une config

Le format complet est décrit dans la [référence de la config](https://adriengras.github.io/questionator-z4000-hyperdrive/docs/guide/reference-config.html) du guide. Point de départ : le [fichier d'exemple](examples/config.example.json), dont la première ligne pointe vers le JSON Schema publié :

```json
"$schema": "https://adriengras.github.io/questionator-z4000-hyperdrive/config.schema.json"
```

## Développement

Prérequis : [nvm](https://github.com/nvm-sh/nvm) et pnpm (version fixée par `packageManager`). Activer corepack avant l'installation (Node 24 le fournit ; avec un pnpm global plus ancien, préfixer chaque commande par `corepack pnpm …`).

```bash
nvm use
corepack enable
pnpm install
pnpm dev        # serveur de développement
pnpm check      # format, lint, dépendances, types, tests (comme la CI, hors build)
pnpm deps       # sens des imports entre dossiers (dependency-cruiser)
pnpm build      # build de production dans dist/ (avec le service worker)
pnpm preview    # sert dist/ pour tester le hors ligne
pnpm docs:dev   # site de documentation (VitePress), sur http://localhost:5173/questionator-z4000-hyperdrive/docs/
pnpm docs:build # construit la documentation dans dist/docs/ (après pnpm build)
```

## Conventions

- Commits en [gitmoji](https://gitmoji.dev), message en français (voir [`docs/CONVENTIONS.md`](docs/CONVENTIONS.md)).
- Une branche et une pull request par ticket, `Closes #n` dans la PR ; la CI doit être verte.

## Licence

[MIT](LICENSE)
