# S'entraîner seul

L'entraînement sert à réviser un cours sans examinateur. Vous donnez votre cours à un LLM, il en tire une config de questions, vous la déposez dans l'application, puis vous tirez des questions et vous vous notez vous-même. Il n'y a pas de liste d'étudiants ni de passage : seulement vous et vos questions.

## Ce qu'il vous faut

- Votre cours, réuni dans un seul fichier PDF ou une seule archive zip.
- Un LLM qui a accès au web et qui accepte un fichier en pièce jointe. Le prompt de l'application renvoie vers le README du projet et vers un schéma allégé de la config : sans accès au web, le LLM ne peut pas les lire et produit une config invalide.

L'application ne lit jamais votre cours. Vous le donnez au LLM, pas à l'application, et il reste chez vous.

## Créer un entraînement

Ouvrez l'espace Entraînement depuis le menu, puis cliquez sur « Nouvel entraînement ». Le bouton « S’entraîner » de l'accueil, ou « S’entraîner seul » au premier lancement, mène au même écran. L'écran « S’entraîner » propose quatre étapes, de « Étape 1 sur 4 » à « Étape 4 sur 4 ». L'étape en cours est mise en avant, mais l'ordre n'est qu'indicatif : toutes restent utilisables, et vous pouvez déposer une config dès l'ouverture.

1. **Rassemblez votre cours.** Réunissez le cours et les ateliers dans un seul PDF ou une seule archive zip.
2. **Copiez le prompt.** Cliquez sur « Copier le prompt ». L'étape se résume alors en « Prompt copié. », avec un bouton « Copier à nouveau », et le texte se range dans « Afficher le prompt ». Si la copie échoue, sélectionnez le texte du champ « Prompt à copier » et copiez-le à la main.
3. **Récupérez la config.** Collez le prompt dans le LLM, joignez votre fichier de cours et attendez le résultat. **Réglez le LLM sur son effort de réflexion maximal** : plus le cours est long, plus ça compte, et un effort réduit donne des questions superficielles ou un JSON incomplet. Le LLM rend un fichier `.json`, ou un bloc de code JSON.

   ![Étape 2 sur 4, « Copiez le prompt » : l’encadré « Réglez le LLM sur son effort de réflexion maximal », le prompt à copier et le bouton Copier le prompt.](/screenshots/entrainement-mise-en-place.png)

4. **Déposez-la.** Déposez le fichier dans la zone « Config (JSON) », marquée « Déposez la config (.json) ici », ou choisissez-le. Une fois lu, la zone affiche son nom et son état, par exemple « Fichier valide ». Si le LLM n'a rendu qu'un bloc de code, dépliez « … ou collez le JSON ici », collez-le, puis cliquez sur « Vérifier ».

L'application vérifie la config avec les mêmes règles que pour un oral. Vous obtenez l'un des deux résultats suivants.

- **La config est valide.** Un récapitulatif affiche le titre et, sous « Questions par niveau », le nombre de questions de chaque catégorie. Cliquez sur « C’est parti » pour créer l'entraînement. Avant, le bouton est inactif et indique « Disponible une fois la config validée ».
- **La config contient des erreurs.** Une liste indique chaque problème. Cliquez sur « Corriger dans l’éditeur » pour ouvrir [l'éditeur de config](./editeur-config) avec ce texte. Chaque message est expliqué dans [FAQ et dépannage](./depannage). Les `id` en double (voir [catégorie](./depannage#duplicate_category_id), [question](./depannage#duplicate_question_id)) et les [valeurs en double dans un barème](./depannage#duplicate_scale_value) sont des erreurs que vous pouvez corriger dans l'éditeur. Sinon, relancez le LLM en lui collant le message d'erreur.

Le prompt impose quatre catégories de difficulté croissante (Facile, Normal, Difficile, Cauchemar), avec les mêmes `id` d'une génération à l'autre. Chaque question porte une réponse de référence dans son champ `answer`. Ce sont des questions d'oral : le prompt interdit de faire écrire du code et de demander des détails propres aux ateliers (noms de classes, de fichiers…). Quand une question s'appuie sur du code, l'énoncé fournit un court extrait sur lequel raisonner.

## Réviser

L'écran de l'entraînement porte le titre de la config. Sous « Choisissez une catégorie », il affiche une tuile par catégorie. Une catégorie ne s'épuise jamais : vous pouvez tirer dans n'importe laquelle, dans n'importe quel ordre.

1. **Cliquez sur une tuile.** L'application tire une question de cette catégorie. Une catégorie sort d'abord ses questions jamais vues, puis se remélange une fois épuisée. Pendant la question, les tuiles restent visibles au-dessus, mais inactives ; celle de la question en cours est mise en avant.
2. **Répondez de tête, ou à voix haute.** La carte de la question rappelle la catégorie et sa valeur (« Normal · 2 pts »). Prenez le temps d'y penser avant de continuer.
3. **Cliquez sur « Voir la réponse ».** Le bloc « Réponse » s'ouvre avec la réponse de référence. « Masquer » le replie, « Afficher » le rouvre. Si la question n'a pas de réponse, l'écran l'indique.
4. **Notez-vous.** Sous « Notez-vous · sur 2 », un bouton par valeur du barème de la catégorie. Cliquez sur celui qui correspond à votre réponse. Comparez-vous à la réponse de référence, qui détaille en général ce que vaut chaque palier.

![Question tirée dans la catégorie Normal, réponse révélée : les tuiles inactives en haut, l’énoncé et son extrait de code, le bloc Réponse avec la réponse de référence et son barème, puis les boutons de 0 à 2 sous « Notez-vous » et « Passer » à droite.](/screenshots/entrainement-question.png)

Après la note, l'écran revient aux tuiles.

### Passer une question

« Passer », à droite des boutons de note, est disponible avant et après avoir vu la réponse. La question est alors écartée sans note : elle ne compte ni en réussite ni en échec.

### Recharger la page

Si vous fermez l'onglet ou actualisez la page entre le tirage et la note, la question en attente revient au rechargement. Sa réponse est de nouveau masquée : cliquez sur « Voir la réponse » pour la lire.

## Reprendre un entraînement

La page Entraînement, dans le menu, liste vos entraînements, le plus récemment utilisé en premier. Chaque carte indique la dernière activité, votre taux de réussite (« 66,7 % de réussite ») et la couverture, c'est-à-dire les questions notées au moins une fois sur le total (« 5 / 9 questions notées »). Cliquez sur « Reprendre » pour retrouver les tuiles. Vos entraînements récents apparaissent aussi dans la section « Reprendre » de l'accueil, avec les mêmes chiffres.

![Page Entraînement : le bouton Nouvel entraînement, puis la carte « Git, les bases » avec sa dernière activité, son anneau à 66,7 % de réussite, « 5 / 9 questions notées » et les boutons Reprendre et Stats.](/screenshots/entrainements.png)

La carte porte aussi un lien « Stats ». Son menu « … » propose « Mettre à jour la config » et « Supprimer ». La suppression efface l'entraînement avec son historique, sans retour possible.

Comme les sessions, les entraînements sont enregistrés dans le stockage local de ce navigateur. Voir [Prise en main](./prise-en-main#vos-donnees-restent-sur-votre-appareil).

Si les données d'un entraînement ne passent plus la validation, la carte porte la pastille « Endommagée » et ne peut pas être ouverte : il ne reste que « Supprimer », affiché en bouton sur la carte.

## Voir ses stats

Sur l'écran de l'entraînement, cliquez sur « Voir les stats », en haut à droite. Le lien « Stats » de la carte, sur la page Entraînement ou sur l'accueil, mène au même écran. « Retour à l’entraînement » ramène aux tuiles. Tant qu'aucune réponse n'est notée, l'écran l'indique et propose « Aller à l’entraînement ».

![Écran de stats de l’entraînement « Git, les bases » : les chiffres clés (5 réponses notées, 1 passée, 5 / 9 questions notées), les anneaux Par niveau, les barres Par notion, puis le début de la liste À revoir.](/screenshots/entrainement-stats.png)

L'écran se lit de haut en bas.

- **« Chiffres clés ».** Le nombre de réponses notées et de questions passées, compté en tirages : une question notée trois fois compte pour trois. Puis la couverture, par exemple « 5 / 9 questions notées » : les questions notées au moins une fois, sur le total de la config.
- **« Par niveau » et « Par notion ».** Le taux de réussite par catégorie, en anneaux, puis par tag de question, en barres. « — » signale qu'aucune note n'existe encore. Sous chaque anneau, les questions notées sur le total de la catégorie (« 2 / 3 notées »).
- **« À revoir ».** Les questions dont la dernière note est sous la moitié du barème, avec leur nombre en tête de bloc. Chaque ligne rappelle la catégorie, la dernière note et le nombre de passages. Une question sort de la liste dès qu'une note plus récente atteint la moitié.
- **Le détail.** Replié par défaut : cliquez sur « Détail des N questions » pour l'ouvrir. Une ligne par question, avec le nombre de passages notés, la dernière note et le statut.

Une note garde le barème du moment où vous l'avez donnée. Une question passée n'entre pas dans les taux.

## Mettre à jour la config

Votre cours évolue, ou le LLM a produit de meilleures questions : vous pouvez remplacer la config sans perdre votre historique. Cliquez sur « Mettre à jour la config » sur l'écran de l'entraînement, ou dans le menu « … » de sa carte sur la page Entraînement.

L'écran reprend les quatre étapes de la création. Une fois la nouvelle config valide, le « Bilan de la mise à jour » s'affiche avant toute modification, en trois cartes :

- les questions « conservées » : « Historique gardé » ;
- les « nouvelles » : « Ajoutées au tirage » ;
- les « retirées » : « N’apparaissent plus dans les stats ».

Le bilan compare les questions par leur `id`, toutes catégories confondues. Une question qui garde son `id` garde ses notes, même si son texte ou sa catégorie changent. Si vous relancez le LLM, demandez-lui de garder les `id` des questions existantes.

Cliquez sur « Mettre à jour » pour appliquer le changement. L'application revient à l'écran de l'entraînement. Le nom de l'entraînement suit le titre de la nouvelle config.

Les notes d'une question retirée restent enregistrées, mais les stats ne les comptent plus. Si une question tirée et pas encore notée est retirée, elle est marquée comme passée.
