# Créer, reprendre et importer une session

Une session regroupe un oral : sa config, sa liste d'étudiants et tous les passages déjà faits. Cette page explique comment la créer, la retrouver, la sauvegarder et la supprimer.

## Créer une session

Depuis l'accueil, cliquez sur « Créer une session », déposez la liste d'étudiants et la config, vérifiez l'aperçu, nommez la session, puis cliquez sur « Créer la session ». Le parcours complet est décrit dans [Prise en main](./prise-en-main). Les fichiers sont décrits dans [Préparer les fichiers](./preparer-les-fichiers).

Une session est une copie : une fois créée, elle ne dépend plus des fichiers d'origine. Modifier la config ou le CSV ensuite n'a aucun effet sur elle. Pour changer de config, créez une nouvelle session.

Au moment de la création, le navigateur peut vous demander l'autorisation de conserver durablement les données du site. Acceptez : sans elle, il peut les effacer s'il manque d'espace.

## Retrouver et reprendre une session

Les sessions s'affichent à droite de l'accueil, la plus récemment modifiée en premier. Chaque carte indique :

- le nom de la session et le titre de l'examen ;
- le nom de l'examinateur, s'il est renseigné (« Jury : … ») ;
- la date de dernière modification ;
- l'avancement, par exemple « 1 passé · 0 absent · 9 restants ».

![Accueil avec une session : la carte « Oral de démonstration » indique le titre de l'examen, la date de modification et l'avancement, avec le bouton Reprendre.](/screenshots/accueil-sessions.png)

Cliquez sur « Reprendre » pour rouvrir la session là où vous l'avez laissée : même étudiant, même question en cours. Chaque action est enregistrée au moment où vous la faites, vous n'avez rien à sauvegarder avant de quitter.

## Gérer une session

Le bouton « ... » de la carte ouvre un menu d'actions :

- **Renommer** : change le nom de la session.
- **Modifier l'examinateur** : change le nom de l'examinateur, repris en colonne dans les exports. Le champ est facultatif.
- **Exporter un backup** : télécharge la session dans un fichier `.json` (voir ci-dessous).
- **Exporter en Excel** : télécharge les résultats. Voir [Statistiques et export Excel](./stats-export).
- **Supprimer** : efface la session (voir ci-dessous).

## Sauvegarder : exporter un backup

Un backup est une copie complète de la session dans un fichier : config, étudiants, questions tirées, notes, commentaires. Pour le faire, ouvrez le menu « ... » de la carte et cliquez sur « Exporter un backup ».

Le fichier s'appelle `<nom-de-la-session>-backup-<AAAA-MM-JJ>.json`, par exemple `oral-de-demonstration-backup-2026-09-15.json`. Rangez-le hors du navigateur : un dossier synchronisé, une clé USB.

Faites un backup à la fin de chaque séance, et avant toute opération risquée. C'est la seule copie qui survit à un effacement des données du navigateur.

## Restaurer : importer un backup

Sur l'accueil, la carte « Restaurer une session » propose le bouton « Importer un backup ». Choisissez le fichier `.json` créé par « Exporter un backup ». Vous pouvez aussi déposer le fichier n'importe où sur la page de l'accueil.

La session apparaît dans la liste. Importer un backup sur un autre ordinateur est le moyen de transporter une session d'un appareil à l'autre.

- **La session existe déjà.** Chaque session a un identifiant, conservé dans le backup. Si une session portant le même identifiant est déjà présente, une fenêtre « Session déjà présente » vous le dit, avec son nom et sa date de modification. « Remplacer » écrase la session de l'appareil par celle du fichier. « Annuler » ne change rien.
- **Le fichier est refusé.** Une fenêtre « Import impossible : *nom du fichier* » liste les problèmes. Rien n'est enregistré. Cliquez sur « Fermer ». Vérifiez que le fichier vient bien de « Exporter un backup » et qu'il n'a pas été modifié.

Un backup n'est pas une config : pour importer un fichier de config, passez par « Créer une session » ou par l'[Éditeur de config](./editeur-config).

## Supprimer une session

Dans le menu « ... », cliquez sur « Supprimer ». Une fenêtre « Supprimer « *nom* » ? » prévient que l'action est définitive : tous les passages de la session seront perdus. Trois boutons :

- « Exporter un backup d'abord » télécharge un backup et laisse la fenêtre ouverte ;
- « Annuler » ferme la fenêtre sans rien supprimer ;
- « Supprimer » efface la session.

## Une session endommagée

Si le contenu enregistré d'une session est incohérent, sa carte porte le badge « Endommagée » et l'application ne peut pas l'ouvrir. Le menu de la carte propose encore « Exporter un backup », pour conserver le contenu ou le faire corriger, et « Supprimer ».

## Ce qui est conservé, et où

Tout reste dans le navigateur de l'appareil que vous utilisez. Rien n'est envoyé ailleurs.

| Donnée | Où | Ce qui la fait disparaître |
| --- | --- | --- |
| Les sessions : config, étudiants, passages, notes, commentaires | Base du navigateur (IndexedDB) | Effacer les données du site, un manque d'espace, « Supprimer » |
| Le brouillon de l'éditeur de config | Stockage local du navigateur | Effacer les données du site |
| Le mode d'affichage clair, sombre ou système | Stockage local du navigateur | Effacer les données du site |
| Les fichiers de backup et d'export | Le dossier de téléchargements de votre navigateur | Vous seul les supprimez |

Un navigateur ne partage rien avec un autre : une session créée dans Chrome n'existe pas dans Firefox, ni dans une fenêtre de navigation privée. Si une icône d'avertissement apparaît en haut de l'accueil, le navigateur ne promet pas de conserver vos données : survolez-la pour lire le message. Faites des backups réguliers.

Pour les cas où les sessions ont disparu, voir [Mes sessions ont disparu](./depannage#perte-de-donnees).
