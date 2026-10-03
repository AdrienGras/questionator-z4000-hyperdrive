# Questionator Z-4000 Hyperdrive

[![CI](https://github.com/AdrienGras/questionator-z4000-hyperdrive/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/AdrienGras/questionator-z4000-hyperdrive/actions/workflows/ci.yml?query=branch%3Amain)
[![Quality gate](https://sonarcloud.io/api/project_badges/measure?project=AdrienGras_questionator-z4000-hyperdrive&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=AdrienGras_questionator-z4000-hyperdrive)
[![Application](https://img.shields.io/website?url=https%3A%2F%2Fadriengras.github.io%2Fquestionator-z4000-hyperdrive%2F&label=application&up_message=en%20ligne&down_message=hors%20service&up_color=ff2d95&down_color=lightgrey)](https://adriengras.github.io/questionator-z4000-hyperdrive/)
[![Licence : MIT](https://img.shields.io/badge/licence-MIT-1a1033)](LICENSE)
[![Hors ligne](https://img.shields.io/badge/hors%20ligne-oui-ff2d95)](https://adriengras.github.io/questionator-z4000-hyperdrive/docs/guide/hors-ligne.html)
[![100 % local](https://img.shields.io/badge/donn%C3%A9es-100%20%25%20local-1a1033)](https://adriengras.github.io/questionator-z4000-hyperdrive/docs/guide/prise-en-main.html#vos-donnees-restent-sur-votre-appareil)

![Animation du principe : un étudiant choisit une difficulté, une question est tirée et projetée sur grand écran, il répond à l'oral pendant que l'examinateur voit la réponse attendue et note sur son ordinateur ; puis on consulte les statistiques et on exporte un fichier Excel.](assets/readme-hero.svg)

**Faites passer des oraux notés par tirage au sort, sur deux écrans, sans rien installer.**
L'étudiant choisit une difficulté, l'application tire une question, vous notez. Le score s'affiche après chaque question.

**[▶ Ouvrir l'application](https://adriengras.github.io/questionator-z4000-hyperdrive/)** · **[📖 Lire la documentation](https://adriengras.github.io/questionator-z4000-hyperdrive/docs/)** · **[🚀 Prise en main en 5 minutes](https://adriengras.github.io/questionator-z4000-hyperdrive/docs/guide/prise-en-main.html)**

## Ce qu'elle fait

- 🎲 **Tirage par difficulté** : catégories, barèmes et questions sont décrits dans un fichier JSON. Un étudiant ne tombe jamais deux fois sur la même question.
- 🖥️ **Deux écrans** : la vue projetée montre l'énoncé à l'étudiant. Votre écran garde la réponse attendue et les boutons de note.
- 🧮 **Notation au fil de l'oral** : score cumulé, questions passées, absents, ajustement de la note finale et arrondi.
- 📊 **Statistiques et export Excel** : histogramme des notes, questions les plus tirées, classeur complet en un clic.
- ✏️ **Éditeur de config intégré** : autocomplétion, aide au survol, erreurs en direct et aperçu.
- 🔒 **Tout reste sur votre machine** : aucune donnée n'est envoyée. Vous sauvegardez une session dans un fichier et la réimportez quand vous voulez.
- ✈️ **Fonctionne hors ligne** : installable comme une application, utilisable sans réseau le jour de l'oral.

## Essayer en 5 minutes

1. Ouvrez l'[application](https://adriengras.github.io/questionator-z4000-hyperdrive/) et téléchargez les deux fichiers d'exemple proposés sur l'accueil.
2. Cliquez sur « Créer une session » et déposez les deux fichiers.
3. Tirez une question, notez, recommencez.

La suite est dans la [prise en main](https://adriengras.github.io/questionator-z4000-hyperdrive/docs/guide/prise-en-main.html).

## Écrire votre propre config

Partez du [fichier d'exemple](examples/config.example.json). Sa première ligne pointe vers le JSON Schema publié, ce qui donne l'autocomplétion et la vérification dans VSCode :

```json
"$schema": "https://adriengras.github.io/questionator-z4000-hyperdrive/config.schema.json"
```

Chaque champ est décrit dans la [référence de la config](https://adriengras.github.io/questionator-z4000-hyperdrive/docs/guide/reference-config.html).

## Contribuer

Bug, idée ou question : lisez [`CONTRIBUTING.md`](CONTRIBUTING.md). Pour le code, le [guide contributeur](https://adriengras.github.io/questionator-z4000-hyperdrive/docs/contribuer/installer.html) vous mène du clonage à un `pnpm check` vert.

## Licence

[MIT](LICENSE)
