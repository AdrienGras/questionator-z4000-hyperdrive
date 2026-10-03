# Faire passer un oral

Cette page suit un passage du début à la fin : choisir l'étudiant, tirer les questions, les noter, valider la note finale et passer au suivant. Elle suppose qu'une session existe déjà. Sinon, voyez [Prise en main](./prise-en-main).

## L'écran de passage

L'écran de passage s'ouvre quand vous créez ou reprenez une session. Sous le titre de l'examen, une ligne rappelle l'étudiant en cours (nom puis prénom), la question en cours (« Question 1 / 3 ») et le « Score brut » déjà obtenu. À droite, l'aperçu de la vue projetée ([Projeter](./projeter)). Au centre, selon l'état du passage, la grille des catégories, la question en cours ou l'écran final.

Les actions qui touchent à plusieurs étudiants sont dans le panneau latéral. Le bouton « Panneau », en haut à droite, l'ouvre. Il a deux onglets : « Étudiant » pour l'étudiant en cours, « Étudiants » pour la liste de la session.

## Choisir l'étudiant

À la création, le premier étudiant de la liste est déjà sélectionné. Pour en choisir un autre :

1. Cliquez sur « Panneau », puis sur l'onglet « Étudiants ».
2. Cliquez sur la ligne de l'étudiant. Le panneau se referme.

![Panneau latéral ouvert sur l'onglet Étudiants : la liste des étudiants avec leur statut, leur note et un bouton d'absence par ligne.](/screenshots/passage-panneau.png)

Chaque ligne indique le nom, le statut (« à passer », « en cours », « terminé » ou « absent ») et deux notes : la note brute puis la note finale, par exemple « 0 · — ». Un tiret signifie que la note n'est pas encore calculable. Pour un absent, la ligne affiche le libellé d'absence de la config (`ABS` par défaut). Une icône d'écran marque l'étudiant actuellement projeté.

Vous pouvez changer d'étudiant à tout moment, y compris au milieu d'une question : les questions déjà tirées sont conservées, et vous reprenez l'étudiant là où vous l'aviez laissé.

Pour ajouter un étudiant en séance, cliquez sur « Ajouter un étudiant » en haut de l'onglet. Saisissez le nom et le prénom, puis cliquez sur « Ajouter », ou sur « Ajouter et faire passer » pour le sélectionner aussitôt. Si ce nom est déjà dans la liste, un message vous le signale, sans vous bloquer. L'étudiant ajouté est compté à part dans les statistiques et dans l'export.

## Tirer une question

La grille des catégories a une tuile par catégorie, dans l'ordre de la config, avec son maximum de points (« 2 pts »). Cliquez sur une tuile : l'application tire au hasard une question de cette catégorie, parmi celles que cet étudiant n'a pas encore eues.

Trois règles à connaître :

- **Une question ne revient jamais pour le même étudiant**, qu'elle ait été notée ou passée.
- **Une catégorie sans question disponible est grisée.** En survolant la tuile, l'infobulle dit « Plus de question disponible dans cette catégorie ».
- **Une seule question à la fois.** Tant qu'une question est en cours, la grille est inactive. Notez ou passez la question pour tirer la suivante.

Chaque étudiant a son propre tirage.

## Ce que vous voyez pendant la question

L'écran affiche la catégorie, le titre de la question et son énoncé, tel qu'il est écrit dans la config (Markdown, code coloré). Sous l'énoncé, le volet « Éléments de réponse » est replié. Dépliez-le pour lire la réponse attendue. Il se referme à chaque nouvelle question. Seul l'examinateur voit ce volet : la vue projetée ne l'affiche jamais.

![Écran de passage : la question tirée et ses éléments de réponse à gauche, les boutons de note sous l'énoncé, l'aperçu de la vue projetée à droite.](/screenshots/passage-question.png)

## Noter la réponse

Sous l'énoncé, la rubrique « Note » propose un bouton par valeur du barème de la catégorie : `0`, `0,5`, `1`, `1,5`, `2` dans l'exemple ci-dessus. Cliquez sur la valeur qui convient. La note est enregistrée tout de suite, sans confirmation, et la grille se réactive.

Le « Score brut » de la ligne d'infos additionne les notes des questions déjà notées. Il suit au fil du passage.

Pour corriger une note, ouvrez le panneau, onglet « Étudiant ». La rubrique « Questions » liste les questions de l'étudiant. Chaque question notée a une liste déroulante pour changer sa note. Les totaux se recalculent. Ça fonctionne aussi après la fin du passage.

## Passer une question

Le bouton « Passer la question (2 passes restantes) » écarte la question en cours sans la noter. Il n'apparaît que si les skips sont activés dans la config (`skips.enabled`). Le nombre de passes par étudiant vient de `skips.maxPerStudent` : voir la [référence de la config](./reference-config#skips).

1. Cliquez sur le bouton. Une fenêtre « Passer la question ? » s'ouvre.
2. Choisissez un motif, si vous le souhaitez : un des boutons proposés (`skips.reasons`), ou du texte dans le champ « Autre motif » (si `skips.allowFreeText` l'autorise). Choisir un bouton vide le champ, et inversement. Le motif est facultatif.
3. Cliquez sur « Passer ». Pour renoncer, cliquez sur « Annuler ».

Ce que fait un skip :

- la question ne compte pas dans le passage : l'étudiant devra répondre au même nombre de questions notées (`scoring.questionsPerStudent`) ;
- elle ne sera pas tirée de nouveau pour cet étudiant ;
- **un skip ne s'annule pas** ;
- quand toutes les passes sont utilisées, le bouton reste visible mais inactif, et l'infobulle dit « Plus de passe disponible pour cet étudiant ».

La question passée reste dans le détail du passage, avec la mention « Passée » et son motif (« Passée — Hors programme »), et dans l'export. Voir [Statistiques et export Excel](./stats-export).

## Le commentaire

Dans le panneau, onglet « Étudiant », le champ « Commentaire » accepte du texte libre. Il s'enregistre tout seul quand vous arrêtez de taper ou quittez le champ. Le message « Enregistrement… » devient « Enregistré » ; en cas de problème, « Échec de l’enregistrement ». Le commentaire est repris dans la colonne « Commentaire » de l'export. Il est conservé si vous réinitialisez l'étudiant ou le déclarez absent.

## Terminer le passage et fixer la note

Le passage est terminé quand l'étudiant a autant de questions **notées** que `scoring.questionsPerStudent`. L'écran « Passage terminé » affiche alors les notes, calculées ainsi :

| Ligne | Calcul |
| --- | --- |
| Note brute | Somme des notes des questions. |
| Note plafonnée | Note brute, limitée à `scoring.maxRawScore`. |
| Note convertie | Note plafonnée ramenée à l'échelle finale (`scoring.finalScale`), arrondie selon `scoring.rounding`, entre 0 et l'échelle. |
| Ajustement | Correction manuelle de l'examinateur, « aucun » par défaut. |
| Note finale | Note convertie plus ajustement, arrondie de la même façon, entre 0 et l'échelle. |

Par exemple, avec une note brute maximale de 10 et une échelle de 20, une note brute de 3 donne une note convertie de 6,00. Le détail des arrondis est dans la [référence de la config](./reference-config).

![Écran Passage terminé : les notes brute, plafonnée, convertie, l'ajustement et la note finale 6,00 / 20, le détail des trois questions et les boutons Ajuster, Réinitialiser l'étudiant et Étudiant suivant.](/screenshots/passage-note-finale.png)

Sous les notes, « Détail du passage » liste chaque question avec ses points sur le maximum du barème (« 1 / 2 »), ou « Passée ».

### La fenêtre « Ajuster la note » {#ajuster-la-note}

Quand le passage se termine, la fenêtre « Ajuster la note » s'ouvre d'elle-même. Elle sert à corriger la note d'un montant que vous choisissez :

- saisissez l'ajustement dans le champ « Ajustement », ou utilisez les boutons « Retirer un pas » et « Ajouter un pas ». Le pas est le pas d'arrondi de la config (0,5 par exemple). La valeur peut être négative. Elle va de moins l'échelle à plus l'échelle ;
- la ligne sous le champ montre le calcul, par exemple « 6,00 + 1,00 = 7,00 / 20 ». Si le résultat sort de l'échelle, il est borné et la ligne l'indique (« bornée à 20 ») ;
- « Justification (facultative) » garde la raison de l'ajustement. Elle apparaît à côté de la ligne « Ajustement » et dans l'export ;
- « Enregistrer » valide la note avec cet ajustement. « Annuler » la valide sans ajustement.

Échap, ou un clic en dehors de la fenêtre, équivaut à « Annuler ». Dans tous les cas, la note est alors considérée comme annoncée : c'est à ce moment que la vue projetée affiche la note finale. Tant que vous n'avez pas fermé la fenêtre, l'étudiant voit seulement « Passage terminé ».

Pour modifier l'ajustement plus tard, cliquez sur « Ajuster ». Saisir 0 supprime l'ajustement et sa justification. Un ajustement n'est possible qu'une fois le passage terminé.

## Étudiant suivant

Cliquez sur « Étudiant suivant ». L'application sélectionne le premier étudiant « à passer » ou « en cours » qui suit celui-ci dans la liste, puis reprend au début de la liste si elle arrive au bout. Les étudiants terminés et les absents sont sautés. Quand il n'en reste aucun, le bouton est inactif et le message « Tous les étudiants sont passés » s'affiche.

Changer d'étudiant remet la vue projetée sur l'écran d'attente si elle montrait un autre étudiant. Cliquez sur « Projeter cet étudiant » quand vous voulez montrer le suivant. Voir [Projeter](./projeter).

## Étudiant absent

Pour déclarer un étudiant absent, deux endroits :

- dans l'onglet « Étudiants », l'icône à droite de sa ligne (« Marquer *nom* absent ») ;
- dans l'onglet « Étudiant », le bouton « Marquer absent ».

Si l'étudiant a déjà des questions tirées, une fenêtre « Déclarer … absent ? » prévient que **ces questions seront supprimées**. Le commentaire est conservé. Confirmez avec « Déclarer absent ».

Un absent n'entre pas dans les notes, ni dans les statistiques par question. L'écran de passage affiche « Étudiant absent ». Pour le faire passer finalement, cliquez sur « Marquer présent » : il redevient « à passer », sans question. La façon dont l'absent apparaît dans l'Excel dépend de `absent.export` ([Statistiques et export Excel](./stats-export)).

## Recommencer un étudiant

Sur l'écran « Passage terminé », « Réinitialiser l’étudiant » efface ses questions, ses notes et son ajustement, après confirmation (« Réinitialiser »). Le commentaire est conservé. L'étudiant repart de zéro, et ses questions peuvent être tirées de nouveau.

## Pour la suite

- [Projeter](./projeter) : montrer l'énoncé et la note à l'étudiant.
- [Statistiques et export Excel](./stats-export) : lire les résultats de la session.
- [Créer, reprendre et importer une session](./sessions) : reprendre un oral interrompu.
