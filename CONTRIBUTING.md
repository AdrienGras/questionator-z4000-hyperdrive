# Contribuer

Cette page dit par où passer pour signaler un bug, proposer une idée, poser une question ou contribuer du code. Le détail est dans le [guide contributeur](https://adriengras.github.io/questionator-z4000-hyperdrive/docs/contribuer/installer.html).

En participant, vous acceptez le [code de conduite](CODE_OF_CONDUCT.md).

## Signaler un bug

Cherchez d'abord dans la [FAQ et dépannage](https://adriengras.github.io/questionator-z4000-hyperdrive/docs/guide/depannage.html) : chaque message d'erreur y a son entrée. Si le problème n'y est pas, ouvrez une issue avec le formulaire **Bug**. Ne joignez une config ou une liste d'étudiants qu'**anonymisée**.

Une faille de sécurité ne se signale pas dans une issue : voir [`SECURITY.md`](SECURITY.md).

## Proposer une fonctionnalité

Ouvrez une issue avec le formulaire **Fonctionnalité** et décrivez le besoin, dans le contexte d'un oral. [`PRODUCT.md`](PRODUCT.md) décrit le produit et fait foi : une proposition qui le change passe par un arbitrage, voir [Décisions](https://adriengras.github.io/questionator-z4000-hyperdrive/docs/contribuer/decisions.html).

## Poser une question

Lisez d'abord la [documentation](https://adriengras.github.io/questionator-z4000-hyperdrive/docs/). Si la réponse n'y est pas, ouvrez une issue avec le formulaire **Question**.

## Contribuer du code

1. Partez d'une issue : un ticket, une branche, une pull request.
2. Installez le poste : [Installer le poste](https://adriengras.github.io/questionator-z4000-hyperdrive/docs/contribuer/installer.html).
3. Ouvrez la pull request en brouillon, avec `Closes #n` : [Workflow](https://adriengras.github.io/questionator-z4000-hyperdrive/docs/contribuer/workflow.html).
4. Faites passer `pnpm check`, la CI et SonarQube Cloud : [Tests](https://adriengras.github.io/questionator-z4000-hyperdrive/docs/contribuer/tests.html).
5. Passez en « Ready for review ». Le mainteneur relit et fusionne.

Le modèle de pull request reprend la checklist. Les conventions (commits, arborescence, imports) sont dans [Conventions](https://adriengras.github.io/questionator-z4000-hyperdrive/docs/contribuer/conventions.html).
