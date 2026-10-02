# Prise en main

Questionator Z-4000 Hyperdrive sert à faire passer des oraux notés. Vous préparez deux fichiers : une liste d'étudiants et une config qui décrit les catégories de questions, les questions et les barèmes. Pour chaque étudiant, vous tirez des questions au sort par catégorie, vous notez les réponses, et l'application calcule la note finale. Vous pouvez projeter l'énoncé à l'écran pendant que vous gardez la main sur les réponses attendues.

[Ouvrir l'application](https://adriengras.github.io/questionator-z4000-hyperdrive/)

## Vos données restent sur votre appareil

L'application fonctionne entièrement dans le navigateur. Vos fichiers ne sont envoyés à aucun serveur. Les sessions sont enregistrées dans le stockage local du navigateur, sur l'appareil que vous utilisez.

Deux conséquences :

- une session créée sur un ordinateur n'existe pas sur un autre ;
- effacer les données du site efface les sessions.

Exportez régulièrement un backup. Voir [Créer, reprendre et importer une session](./sessions).

## Votre premier oral, pas à pas

Ce parcours utilise les deux fichiers d'exemple. Téléchargez-les d'abord :

- [students.example.csv](https://adriengras.github.io/questionator-z4000-hyperdrive/students.example.csv) : dix étudiants ;
- [config.example.json](https://adriengras.github.io/questionator-z4000-hyperdrive/config.example.json) : un oral de PHP avec quatre catégories.

Ces deux fichiers sont aussi proposés dans l'application, par les liens « Télécharger la liste d'étudiants d'exemple » et « Télécharger la config d'exemple ».

1. **Ouvrez l'accueil.** La carte « Nouvelle session » est à gauche. Tant que vous n'avez rien créé, la zone de droite indique « Aucune session ».

   ![Accueil de l'application : à gauche les cartes Nouvelle session, Restaurer une session et Éditer une config, à droite le message Aucune session.](/screenshots/accueil.png)

2. **Cliquez sur « Créer une session ».** L'écran « Nouvelle session » s'ouvre.

3. **Déposez les deux fichiers.** Glissez la liste d'étudiants dans la zone « Liste d'étudiants (CSV) » et la config dans la zone « Configuration (JSON) ». Vous pouvez aussi cliquer sur « Choisir un fichier ». Une fois un fichier lu, le bouton devient « Remplacer ».

4. **Vérifiez l'aperçu.** Il s'affiche à droite : nombre d'étudiants, titre de l'examen, catégories avec leur nombre de questions et leur barème, nombre de questions par étudiant. Les avertissements éventuels y figurent aussi.

5. **Donnez un nom à la session.** Le champ « Nom de la session » est prérempli avec le titre de l'examen et la date du jour. Le champ « Nom de l'examinateur » est facultatif : il est repris dans les exports.

   ![Écran Nouvelle session : les deux fichiers déposés sont validés, l'aperçu à droite montre 10 étudiants et les quatre catégories.](/screenshots/creation-session.png)

6. **Cliquez sur « Créer la session ».** Le bouton reste inactif tant qu'un fichier manque ou contient une erreur, ou que le nom est vide. L'application ouvre alors l'écran de passage, avec le premier étudiant de la liste déjà sélectionné.

7. **Tirez une question.** Sous le titre, la grille « Choisir une catégorie » montre une tuile par catégorie, avec son maximum de points. Cliquez sur une tuile : l'application tire au sort une question de cette catégorie et l'affiche, avec les « Éléments de réponse » que vous seul voyez.

8. **Notez la réponse.** Sous l'énoncé, la rubrique « Note » propose un bouton par valeur du barème de la catégorie. Cliquez sur celui qui correspond à la réponse de l'étudiant. La question suivante se tire de la même façon.

   ![Écran de passage : la question tirée et ses éléments de réponse à gauche, les boutons de note sous l'énoncé, l'aperçu de la vue projetée à droite.](/screenshots/passage-question.png)

   Avec la config d'exemple, l'écran est sombre : son bloc `presentation` demande `defaultColorMode` à `dark`. Vous pouvez changer de mode avec le bouton en haut à droite.

9. **Terminez le passage.** Après la dernière question notée, l'écran « Passage terminé » affiche la note brute, la note convertie et la note finale. Une fenêtre « Ajuster la note » s'ouvre. Cliquez sur « Enregistrer » pour valider la note avec l'ajustement saisi, ou sur « Annuler » pour la valider sans ajustement.

10. **Passez à l'étudiant suivant.** Cliquez sur « Étudiant suivant ». Le bouton est inactif quand tous les étudiants sont passés.

11. **Consultez les statistiques.** Cliquez sur « Panneau », en haut à droite, puis ouvrez l'onglet « Étudiants » et cliquez sur « Statistiques ». Vous y trouvez les effectifs, la distribution des notes finales et les résultats par catégorie. « Retour au passage » ramène à l'écran précédent.

    ![Écran des statistiques : effectifs, notes finales, histogramme et tableau par catégorie.](/screenshots/statistiques.png)

12. **Exportez les résultats.** Dans le même onglet « Étudiants » du panneau, cliquez sur « Exporter en Excel ». Le même bouton existe dans le menu de la carte de la session, sur l'accueil.

## Pour aller plus loin

- [Préparer les fichiers](./preparer-les-fichiers) : écrire votre propre liste d'étudiants et votre propre config.
- [Référence de la config](./reference-config) : chaque champ du fichier de config.
- [Éditeur de config](./editeur-config) : écrire la config dans l'application, avec contrôle en direct.
- [Créer, reprendre et importer une session](./sessions) : reprendre un oral, sauvegarder, restaurer.
- [Faire passer un oral](./faire-passer) : le détail du passage, des skips, des absents et des ajustements.
- [Projeter](./projeter) : la vue projetée.
- [Statistiques et export](./stats-export) : lire les statistiques et le fichier Excel.
- [Hors ligne](./hors-ligne) : utiliser l'application sans réseau.
- [FAQ et dépannage](./depannage) : un message d'erreur, un fichier mal reconnu, des sessions disparues.
