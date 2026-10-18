# Créer, reprendre et importer une session

Une session regroupe un oral : sa config, sa liste d'étudiants et tous les passages déjà faits. Cette page explique comment la créer, la retrouver, la sauvegarder et la supprimer.

## Créer une session

Cliquez sur « Créer une session », sur l'accueil ou sur la page Sessions du menu. Déposez la liste d'étudiants et la config, vérifiez l'aperçu, nommez la session, puis cliquez sur « Créer la session ». Le parcours complet est décrit dans [Prise en main](./prise-en-main). Les fichiers sont décrits dans [Préparer les fichiers](./preparer-les-fichiers).

Une session est une copie : une fois créée, elle ne dépend plus des fichiers d'origine. Modifier la config ou le CSV ensuite n'a aucun effet sur elle. Pour changer de config, créez une nouvelle session.

Au moment de la création, le navigateur peut vous demander l'autorisation de conserver durablement les données du site. Acceptez : sans elle, il peut les effacer s'il manque d'espace.

## Retrouver et reprendre une session

La page Sessions, dans le menu, liste toutes vos sessions, la plus récemment modifiée en premier. Chaque carte indique :

- le nom de la session et le titre de l'examen ;
- la date de dernière modification, suivie du nom de l'examinateur s'il est renseigné (« Jury : … ») ;
- l'avancement : le nombre d'étudiants passés sur le total (« 1 / 10 passés »), une barre, puis les absents et les restants (« 0 absent · 9 restants »).

![Page Sessions : les boutons Importer une sauvegarde et Créer une session en haut, l'encart de dépôt d'une sauvegarde, puis la carte « Oral de démonstration » avec sa date de modification, « 1 / 10 passés », sa barre d'avancement et le bouton Reprendre.](/screenshots/sessions.png)

Cliquez sur « Reprendre » pour rouvrir la session là où vous l'avez laissée : même étudiant, même question en cours. Chaque action est enregistrée au moment où vous la faites : vous n'avez rien à sauvegarder avant de quitter.

L'accueil offre un raccourci. Sa section « Reprendre » montre les trois sessions ou entraînements les plus récents, avec leur avancement et leur bouton « Reprendre ». Les tuiles « Espaces », en dessous, indiquent combien vous avez de sessions et d'entraînements ; « Voir tout » ouvre la page correspondante.

![Accueil : la section Reprendre avec la carte de l'entraînement « Git, les bases » et celle de la session « Oral de démonstration », puis les tuiles Sessions, Entraînements et Éditeur de config.](/screenshots/accueil-reprendre.png)

## Gérer une session

Le bouton « … » de la carte, sur la page Sessions, ouvre un menu d'actions :

- **Renommer** : change le nom de la session.
- **Modifier l'examinateur** : change le nom de l'examinateur, repris en colonne dans les exports. Le champ est facultatif.
- **Exporter une sauvegarde** : télécharge la session dans un fichier `.json` (voir ci-dessous).
- **Exporter en Excel** : télécharge les résultats. Voir [Statistiques et export Excel](./stats-export).
- **Supprimer** : efface la session (voir ci-dessous).

## Exporter une sauvegarde

Une sauvegarde est une copie complète de la session dans un fichier : config, étudiants, questions tirées, notes, commentaires. Pour en faire une, ouvrez le menu « … » de la carte et cliquez sur « Exporter une sauvegarde ».

Le fichier s'appelle `<nom-de-la-session>-backup-<AAAA-MM-JJ>.json`, par exemple `oral-de-demonstration-backup-2026-09-15.json`. Rangez-le hors du navigateur, dans un dossier synchronisé ou sur une clé USB.

Exportez une sauvegarde à la fin de chaque séance, et avant toute opération risquée. C'est la seule copie qui survit à un effacement des données du navigateur.

## Restaurer une session : importer une sauvegarde

Cliquez sur « Importer une sauvegarde », sur la page Sessions ou sur l'accueil, puis choisissez le fichier `.json` créé par « Exporter une sauvegarde ». Vous pouvez aussi déposer le fichier n'importe où sur l'une de ces deux pages.

La session apparaît dans la liste. Importer une sauvegarde sur un autre ordinateur est le moyen de transporter une session d'un appareil à l'autre.

- **La session existe déjà.** Chaque session a un identifiant, conservé dans la sauvegarde. Si une session portant le même identifiant est déjà présente, une fenêtre « Session déjà présente » vous le dit, avec son nom et sa date de modification. « Remplacer » écrase la session de l'appareil par celle du fichier. « Annuler » ne change rien.
- **Le fichier est refusé.** Une fenêtre « Import impossible : *nom du fichier* » liste les problèmes. Rien n'est enregistré. Cliquez sur « Fermer ». Vérifiez que le fichier vient bien de « Exporter une sauvegarde » et qu'il n'a pas été modifié.

Une sauvegarde n'est pas une config : pour utiliser un fichier de config, passez par « Créer une session » ou par l'[Éditeur de config](./editeur-config).

## Supprimer une session

Dans le menu « … », cliquez sur « Supprimer ». Une fenêtre « Supprimer « *nom* » ? » prévient que l'action est définitive : tous les passages de la session seront perdus. Trois boutons :

- « Exporter une sauvegarde d'abord » télécharge la sauvegarde et laisse la fenêtre ouverte ;
- « Annuler » ferme la fenêtre sans rien supprimer ;
- « Supprimer » efface la session.

## Une session endommagée

Si le contenu enregistré d'une session est incohérent, sa carte porte le badge « Endommagée » et l'application ne peut pas l'ouvrir. La carte affiche le bouton « Exporter une sauvegarde », pour conserver le contenu ou le faire corriger ; son menu « … » propose aussi « Supprimer ». Une session endommagée n'apparaît pas dans la section « Reprendre » de l'accueil.

## Ce qui est conservé, et où

Tout reste dans le navigateur de l'appareil que vous utilisez. Rien n'est envoyé ailleurs.

| Donnée | Où | Ce qui la fait disparaître |
| --- | --- | --- |
| Les sessions : config, étudiants, passages, notes, commentaires | Base du navigateur (IndexedDB) | Effacer les données du site, un manque d'espace, « Supprimer » |
| Les entraînements : config et historique des notes | Base du navigateur (IndexedDB) | Effacer les données du site, un manque d'espace, « Supprimer » |
| Le brouillon de l'éditeur de config | Stockage local du navigateur | Effacer les données du site |
| Le mode d'affichage, global et propre à chaque session ou entraînement | Stockage local du navigateur | Effacer les données du site |
| Le menu replié ou déplié | Stockage local du navigateur | Effacer les données du site |
| Les sauvegardes et les exports Excel | Le dossier de téléchargements de votre navigateur | Vous seul les supprimez |

Un navigateur ne partage rien avec un autre : une session créée dans Chrome n'existe pas dans Firefox, ni dans une fenêtre de navigation privée. Si le badge « Stockage non garanti » apparaît sous le titre de l'accueil, le navigateur ne promet pas de conserver vos données : survolez-le pour lire le message. Exportez des sauvegardes régulièrement.

Pour les cas où les sessions ont disparu, voir [Mes sessions ont disparu](./depannage#perte-de-donnees).
