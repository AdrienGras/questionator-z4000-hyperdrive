# Questionator Z-4000 Hyperdrive

![Animation du principe : un étudiant choisit une difficulté, une question est tirée et projetée sur grand écran, il répond à l'oral pendant que l'examinateur voit la réponse attendue et note sur son ordinateur ; puis on consulte les statistiques et on exporte un fichier Excel.](assets/readme-hero.svg)

Application web pour faire passer des oraux notés par tirage de questions. L'étudiant choisit une catégorie de difficulté, l'application tire une question au hasard, l'examinateur note, et le score cumulé est affiché après chaque question.

Tout tourne dans le navigateur : aucune donnée ne quitte la machine de l'examinateur.

**Application :** https://adriengras.github.io/questionator-z4000-hyperdrive/

> Projet en cours de construction. La spécification complète est dans [`PRODUCT.md`](PRODUCT.md).

## Usage prévu

1. Préparer une liste d'étudiants (CSV nom / prénom, partir du [fichier d'exemple](https://adriengras.github.io/questionator-z4000-hyperdrive/students.example.csv), aussi dans [`examples/students.example.csv`](examples/students.example.csv)) et un fichier de configuration (JSON : catégories, questions, barèmes).
2. Créer une session dans l'application à partir de ces deux fichiers.
3. Faire passer chaque étudiant, avec une vue projetée pour l'étudiant et une vue de pilotage pour l'examinateur.
4. Exporter les résultats en Excel.

## Hors ligne et installation

Après un premier chargement en ligne, l'application fonctionne sans réseau : créer une session, faire passer, projeter, exporter. Elle s'installe comme une application (Chrome, Edge : icône d'installation dans la barre d'adresse). Quand une nouvelle version est publiée, un bouton « Recharger » la propose ; elle n'est jamais appliquée d'office. Seule exception hors ligne : une image distante dans une question (URL externe) ne s'affiche pas.

## Écrire une config

Partir du [fichier d'exemple](https://adriengras.github.io/questionator-z4000-hyperdrive/config.example.json) (aussi dans [`examples/config.example.json`](examples/config.example.json)). Sa première ligne pointe vers le JSON Schema publié :

```json
"$schema": "https://adriengras.github.io/questionator-z4000-hyperdrive/config.schema.json"
```

VSCode et les éditeurs compatibles en tirent l'autocomplétion des champs et des noms d'icônes [Tabler](https://tabler.io/icons), et affichent au survol la description, les valeurs possibles et le défaut de chaque champ. L'éditeur de l'application (Ctrl+Espace, survol) propose les mêmes aides. L'éditeur ne vérifie que la structure ; les règles croisées (identifiants uniques, barèmes, nombre de questions, couleurs…) sont vérifiées par l'application à la création de session. Les blocs de code des énoncés et des réponses sont colorés pour tous les langages de Shiki ; un langage inconnu est signalé à la création de session et s'affiche en texte brut. Le format complet est décrit dans [`PRODUCT.md`](PRODUCT.md) §6.2.

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
```

## Conventions

- Commits en [gitmoji](https://gitmoji.dev), message en français (voir [`docs/CONVENTIONS.md`](docs/CONVENTIONS.md)).
- Une branche et une pull request par ticket, `Closes #n` dans la PR ; la CI doit être verte.

## Licence

[MIT](LICENSE)
