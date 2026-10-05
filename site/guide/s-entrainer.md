# S'entraîner seul

L'entraînement sert à réviser un cours sans examinateur. Vous donnez votre cours à un LLM, il en tire une config de questions, vous la déposez dans l'application, puis vous tirez des questions et vous vous notez vous-même. Il n'y a pas de liste d'étudiants ni de passage : seulement vous et vos questions.

## Ce qu'il vous faut

- Votre cours, réuni dans un seul fichier PDF ou une seule archive zip.
- Un LLM qui a accès au web et qui accepte un fichier en pièce jointe. Le prompt de l'application renvoie vers le README du projet et vers un schéma allégé de la config : sans accès au web, le LLM ne peut pas les lire et produit une config invalide.

L'application ne lit jamais votre cours. Vous le donnez au LLM, pas à l'application, et il reste chez vous.

## Créer un entraînement

Sur l'accueil, cliquez sur « Commencer » dans la carte « S'entraîner ». L'écran « S'entraîner » propose quatre étapes numérotées.

1. **Rassemblez votre cours.** Réunissez le cours et les ateliers dans un seul PDF ou une seule archive zip.
2. **Copiez le prompt.** Cliquez sur « Copier le prompt ». L'application confirme par « Prompt copié. ». Si la copie échoue, sélectionnez le texte du champ « Prompt à copier » et copiez-le à la main.
3. **Récupérez la config.** Collez le prompt dans le LLM, joignez votre fichier de cours et attendez le résultat. Le LLM rend un fichier `.json`, ou un bloc de code JSON.
4. **Déposez-la.** Déposez le fichier dans « Config (JSON) ». Si le LLM n'a rendu qu'un bloc de code, collez-le dans « … ou collez le JSON ici », puis cliquez sur « Vérifier le JSON collé ».

L'application vérifie la config avec les mêmes règles que pour un oral. Vous obtenez l'un des deux résultats suivants.

- **La config est valide.** Un récapitulatif affiche le titre et le nombre de questions par catégorie. Cliquez sur « C'est parti » pour créer l'entraînement.
- **La config contient des erreurs.** Une liste indique chaque problème. Cliquez sur « Corriger dans l'éditeur » pour ouvrir [l'éditeur de config](./editeur-config) avec ce texte. Chaque message est expliqué dans [FAQ et dépannage](./depannage). Les LLM se trompent surtout sur les `id` en double et les barèmes : relancez-le en lui collant le message d'erreur.

Le prompt impose quatre catégories de difficulté croissante, avec les mêmes `id` d'une génération à l'autre. Chaque question porte une réponse de référence dans son champ `answer`.

## Réviser

L'écran de l'entraînement affiche une tuile par catégorie. Les tuiles ne sont jamais grisées : vous pouvez tirer dans n'importe quelle catégorie, dans n'importe quel ordre.

1. **Cliquez sur une tuile.** L'application tire une question de cette catégorie. Elle remplace les tuiles à l'écran. Une catégorie sort d'abord ses questions jamais vues, puis se remélange une fois épuisée.
2. **Répondez de tête, ou à voix haute.** Prenez le temps d'y penser avant de continuer.
3. **Cliquez sur « Voir la réponse ».** La réponse de référence s'affiche. Si la question n'en a pas, l'écran l'indique.
4. **Notez-vous.** Sous « Notez-vous », un bouton par valeur du barème de la catégorie. Cliquez sur celui qui correspond à votre réponse. Comparez-vous à la réponse de référence, qui détaille en général ce que vaut chaque palier.

Après la note, l'écran revient aux tuiles.

### Passer une question

« Passer » est disponible avant et après avoir vu la réponse. La question est alors écartée sans note : elle ne compte ni en réussite ni en échec.

### Recharger la page

Si vous fermez l'onglet ou actualisez la page entre le tirage et la note, la question en attente revient au rechargement. Sa réponse est de nouveau masquée : cliquez sur « Voir la réponse » pour la lire.

## Reprendre un entraînement

L'accueil liste vos entraînements dans « Mes entraînements », au-dessus des sessions. La section n'apparaît que si vous en avez au moins un. Chaque carte indique la dernière activité et la part des questions déjà vues (« 40 % des questions vues »). Cliquez sur « Reprendre » pour retrouver les tuiles.

Le menu de la carte propose « Supprimer ». La suppression efface l'entraînement avec son historique, sans retour possible.

Comme les sessions, les entraînements sont enregistrés dans le stockage local de ce navigateur. Voir [Prise en main](./prise-en-main#vos-donnees-restent-sur-votre-appareil).

Si les données d'un entraînement ne passent plus la validation, la carte porte une pastille « endommagé » et l'écran explique ce qui ne va pas. Vous pouvez alors le supprimer.

## Ce qui n'existe pas encore

L'écran de statistiques d'entraînement et la mise à jour d'une config en gardant l'historique ne sont pas encore livrés.
