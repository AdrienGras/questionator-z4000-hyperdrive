# Prise en main

Questionator Z-4000 Hyperdrive sert à faire passer des oraux notés. Vous préparez deux fichiers : une liste d'étudiants et une config qui décrit les catégories de questions, les questions et les barèmes. Pour chaque étudiant, vous tirez des questions au sort par catégorie, vous notez les réponses, et l'application calcule la note finale. Vous pouvez projeter l'énoncé à l'écran pendant que vous gardez la main sur les réponses attendues.

[Ouvrir l'application](https://adriengras.github.io/questionator-z4000-hyperdrive/)

## Vos données restent sur votre appareil

L'application fonctionne entièrement dans le navigateur. Vos fichiers ne sont envoyés à aucun serveur. Les sessions sont enregistrées dans le stockage local du navigateur, sur l'appareil que vous utilisez.

Deux conséquences :

- une session créée sur un ordinateur n'existe pas sur un autre ;
- effacer les données du site efface les sessions.

Exportez régulièrement une sauvegarde. Voir [Créer, reprendre et importer une session](./sessions).

## Se repérer dans l'application

Le menu, à gauche, reste visible sur tous les écrans sauf la vue projetée. Il mène à l'accueil et aux trois espaces de l'application :

- **Accueil** : vos dernières sessions et votre dernier entraînement, à reprendre en un clic ;
- **Sessions** : la liste de vos oraux, la création d'une session et l'import d'une sauvegarde ;
- **Éditeur de config** : écrire ou corriger une config, avec un contrôle en direct ;
- **Entraînement** : réviser seul un cours, sans examinateur ni étudiants.

En bas du menu, « Aide » ouvre cette documentation dans un nouvel onglet. « Replier le menu » ne garde que les icônes : leur nom s'affiche au survol. L'application retient ce choix sur votre appareil. Dans une fenêtre étroite, le menu se range derrière le bouton « Menu », en haut de l'écran.

Sur les écrans d'une session, une ligne au-dessus du titre indique où vous êtes, par exemple `Sessions › Oral de démonstration · Oral PHP`. Cliquez sur « Sessions » pour revenir à la liste.

### Choisir le mode clair ou sombre

La ligne « Mode d'affichage », en bas du menu, propose trois choix : « Clair », « Sombre » et « Système ». « Système », le choix par défaut, suit le réglage de votre ordinateur.

Le réglage dépend de l'écran où vous le faites :

- sur l'accueil, les pages Sessions et Entraînement, l'éditeur et l'écran de création, il vaut pour toute l'application ;
- sur l'écran de passage et les statistiques d'une session, il ne vaut que pour cette session, et de même pour un entraînement. Au départ, une session ou un entraînement suit le champ `defaultColorMode` de sa config.

La vue projetée n'a pas ce réglage : elle suit toujours `defaultColorMode`. Voir [Projeter](./projeter).

![Accueil en mode clair : le menu à gauche avec la ligne Mode d'affichage en bas, les cartes Reprendre d'un entraînement et d'une session, puis les tuiles des trois espaces.](/screenshots/mode-clair.png)

## Votre premier oral, pas à pas

Ce parcours utilise les deux fichiers d'exemple : une liste de dix étudiants et un oral de PHP avec quatre catégories. Téléchargez-les depuis l'accueil de l'application, avec les liens « Liste d’étudiants d’exemple (.csv) » et « Config d’exemple (.json) ».

Les liens directs ci-dessous marchent aussi, mais le navigateur peut ouvrir le fichier dans un onglet au lieu de l'enregistrer. Dans ce cas, faites un clic droit puis « Enregistrer le lien sous ».

- [students.example.csv](https://adriengras.github.io/questionator-z4000-hyperdrive/students.example.csv)
- [config.example.json](https://adriengras.github.io/questionator-z4000-hyperdrive/config.example.json)

L'accueil, le menu et l'écran de création suivent la langue de votre navigateur. Les écrans de la session et l'export suivent le champ `locale` de la config (voir [Référence de la config](./reference-config)).

1. **Ouvrez l'accueil.** Tant que vous n'avez ni session ni entraînement, il présente votre premier oral en trois étapes, avec les liens vers les fichiers d'exemple.

   ![Accueil au premier lancement : le menu à gauche, puis « Votre premier oral en trois étapes » avec les liens de téléchargement des exemples, le bouton Créer une session et, en dessous, « Ou révisez seul ».](/screenshots/accueil.png)

2. **Cliquez sur « Créer une session ».** L'écran « Nouvelle session » s'ouvre. Plus tard, vous trouverez ce bouton sur l'accueil et sur la page Sessions.

3. **Déposez les deux fichiers.** Glissez la liste d'étudiants dans la zone « Liste d'étudiants (CSV) » et la config dans la zone « Configuration (JSON) ». Vous pouvez aussi cliquer sur « Choisir un fichier ». Une fois le fichier lu, la zone affiche son nom et son état, par exemple « Fichier valide », et le bouton devient « Remplacer ».

4. **Vérifiez l'aperçu.** Il s'affiche à droite : nombre d'étudiants, titre de l'examen, catégories avec leur nombre de questions et leur barème, nombre de questions par étudiant. Les avertissements éventuels y figurent aussi.

5. **Donnez un nom à la session.** Le champ « Nom de la session » est prérempli avec le titre de l'examen et la date du jour, par exemple « Oral PHP — 2 octobre 2026 ». Vous pouvez le modifier : sur la capture, il a été remplacé par « Oral de démonstration ». Le champ « Nom de l'examinateur » est facultatif : il est repris dans les exports.

   ![Écran Nouvelle session : les deux zones de dépôt indiquent « Fichier valide », le nom de la session est rempli, l'aperçu à droite montre 10 étudiants et les quatre catégories avec leur barème.](/screenshots/creation-session.png)

6. **Cliquez sur « Créer la session ».** Tant qu'un fichier manque ou contient une erreur, ou que le nom est vide, le bouton reste inactif et une phrase en dessous dit ce qu'il reste à faire. L'application ouvre ensuite l'écran de passage : le nom du premier étudiant de la liste sert de titre.

   Avec la config d'exemple, cet écran est sombre : son bloc `presentation` fixe `defaultColorMode` à `dark`. La ligne « Mode d'affichage » du menu change le mode de cette session.

7. **Tirez une question.** La grille des catégories montre une tuile par catégorie, avec son maximum de points. Cliquez sur une tuile : l'application tire au sort une question de cette catégorie et l'affiche. Pour lire la réponse attendue, dépliez « Éléments de réponse » : la section est repliée à chaque question, et vous seul la voyez.

8. **Notez la réponse.** Dans la colonne de droite, la carte « Note » propose un bouton par valeur du barème de la catégorie. Cliquez sur celui qui correspond à la réponse de l'étudiant : la note est enregistrée et la question se ferme.

   Répétez les étapes 7 et 8 jusqu'à la dernière question. En haut à droite, le compteur « Question 1 / 3 » et sa barre indiquent où vous en êtes, à côté du « Score brut ».

   ![Écran de passage : le nom de l'étudiant en titre, la question tirée et ses éléments de réponse dépliés, les tuiles du tirage suivant en dessous ; à droite, la vue projetée, la carte Note avec les boutons du barème et « Passer la question ».](/screenshots/passage-question.png)

   Sur la capture, l'étudiant est projeté (bouton « Projeter cet étudiant »). Vous n'avez pas à le faire pour ce parcours ; voir [Projeter](./projeter).

9. **Terminez le passage.** Après la dernière question notée, la fenêtre « Ajuster la note » s'ouvre. Cliquez sur « Enregistrer » pour valider la note avec l'ajustement saisi, ou sur « Annuler » pour la valider sans ajustement. L'écran affiche alors « Passage terminé », avec la note finale, la note brute, la note convertie et le détail des questions.

10. **Passez à l'étudiant suivant.** Cliquez sur « Étudiant suivant ». Le bouton est inactif quand tous les étudiants sont passés.

11. **Consultez les statistiques.** Cliquez sur « Panneau », en haut à droite, puis sur « Statistiques », en bas du panneau. Vous y trouvez la synthèse des passages, la distribution des notes finales et la réussite par catégorie. « Retour au passage » ramène à l'écran précédent.

    ![Écran des statistiques : la synthèse (étudiants, passés, absents, moyenne, médiane) avec sa barre d'avancement, l'histogramme des notes finales et les anneaux de réussite par catégorie.](/screenshots/statistiques.png)

12. **Exportez les résultats.** En bas du même panneau, cliquez sur « Exporter en Excel ». Le même choix existe dans le menu « … » de la carte de la session, sur la page Sessions. Le fichier arrive dans le dossier de téléchargements de votre navigateur, nommé `<nom-de-session>-<AAAA-MM-JJ>.xlsx`.

## Pour aller plus loin

- [Préparer les fichiers](./preparer-les-fichiers) : écrire votre propre liste d'étudiants et votre propre config.
- [Référence de la config](./reference-config) : chaque champ du fichier de config.
- [S'entraîner seul](./s-entrainer) : réviser un cours avec une config générée par un LLM, sans examinateur.
- [Éditeur de config](./editeur-config) : écrire la config dans l'application, avec contrôle en direct.
- [Créer, reprendre et importer une session](./sessions) : reprendre un oral, sauvegarder, restaurer.
- [Faire passer un oral](./faire-passer) : le détail du passage, des skips, des absents et des ajustements.
- [Projeter](./projeter) : la vue projetée.
- [Statistiques et export](./stats-export) : lire les statistiques et le fichier Excel.
- [Hors ligne](./hors-ligne) : utiliser l'application sans réseau.
- [FAQ et dépannage](./depannage) : un message d'erreur, un fichier mal reconnu, des sessions disparues.
