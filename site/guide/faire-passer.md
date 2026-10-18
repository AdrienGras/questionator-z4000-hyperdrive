# Faire passer un oral

Cette page suit un passage du début à la fin : choisir l'étudiant, tirer les questions, les noter, valider la note finale et passer au suivant. Elle suppose qu'une session existe déjà. Sinon, voyez [Prise en main](./prise-en-main).

## L'écran de passage

L'écran de passage s'ouvre quand vous créez ou reprenez une session. Son titre est le nom de l'étudiant en cours (nom puis prénom). Au-dessus, le fil d'Ariane rappelle la session et le titre de l'examen, par exemple `Sessions › Oral de démonstration · Oral PHP`. En haut à droite, le compteur « Question 1 / 3 » et sa barre, découpée en une case par question, suivent l'avancement ; à côté, le « Score brut » déjà obtenu, sur son maximum.

L'écran a deux colonnes :

- à gauche, selon l'état du passage, la question en cours, la grille « Tirage suivant » ou l'écran final ;
- à droite, l'aperçu de la vue projetée ([Projeter](./projeter)), puis la carte « Note » pendant une question, et enfin la carte du commentaire avec « Marquer absent ».

Les actions qui touchent à plusieurs étudiants sont dans le panneau latéral. Le bouton « Panneau », en haut à droite, l'ouvre. Il a deux onglets : « Cet étudiant » pour l'étudiant en cours, « Liste » pour tous les étudiants de la session. En bas du panneau, « Statistiques » et « Exporter en Excel » restent visibles quel que soit l'onglet.

## Choisir l'étudiant

À la création, le premier étudiant de la liste est déjà sélectionné. Pour en choisir un autre :

1. Cliquez sur « Panneau », puis sur l'onglet « Liste ».
2. Cliquez sur la ligne de l'étudiant. Le panneau se referme.

![Panneau latéral ouvert sur l'onglet Liste : le résumé « 10 étudiants · 0 terminé · 0 absent », le bouton Ajouter, la liste des étudiants avec leur statut, leurs notes et un bouton d'absence par ligne, puis Statistiques et Exporter en Excel en bas.](/screenshots/passage-panneau.png)

En haut de l'onglet, un résumé compte les étudiants, les terminés et les absents. Chaque ligne indique le nom, le statut (« à passer », « en cours », « terminé » ou « absent ») et deux notes : la note brute puis la note finale, par exemple « 0 · — ». Un tiret signifie que la note n'est pas encore calculable. Pour un absent, la ligne affiche le libellé d'absence de la config (`ABS` par défaut). Une icône d'écran marque l'étudiant actuellement projeté.

Vous pouvez changer d'étudiant à tout moment, y compris au milieu d'une question : les questions déjà tirées sont conservées, et vous reprenez l'étudiant là où vous l'aviez laissé.

Pour ajouter un étudiant en séance, cliquez sur « Ajouter », en haut de l'onglet. La fenêtre « Ajouter un étudiant » s'ouvre. Saisissez le nom et le prénom, puis cliquez sur « Ajouter », ou sur « Ajouter et faire passer » pour le sélectionner aussitôt. Si ce nom est déjà dans la liste, un message vous le signale, sans vous bloquer. L'étudiant ajouté est compté à part dans les statistiques et dans l'export.

## Tirer une question

La grille « Tirage suivant » a une tuile par catégorie, dans l'ordre de la config, avec son icône et son maximum de points (« 2 pts »). Cliquez sur une tuile : l'application tire au hasard une question de cette catégorie, parmi celles que cet étudiant n'a pas encore eues.

Trois règles à connaître :

- **Une question ne revient jamais pour le même étudiant**, qu'elle ait été notée ou passée.
- **Une catégorie sans question disponible est grisée.** En survolant la tuile, l'infobulle dit « Plus de question disponible dans cette catégorie ».
- **Une seule question à la fois.** Tant qu'une question est en cours, la grille, sous la question, est inactive et indique « Disponible une fois la question notée ». Notez ou passez la question pour tirer la suivante.

Chaque étudiant a son propre tirage.

## Ce que vous voyez pendant la question

La carte de la question affiche la catégorie et sa valeur (« Normal · 2 pts »), le titre de la question et son énoncé, tel qu'il est écrit dans la config (Markdown, code coloré). Sous l'énoncé, le volet « Éléments de réponse » est replié. Dépliez-le pour lire la réponse attendue. Il se referme à chaque nouvelle question. Seul l'examinateur voit ce volet : la vue projetée ne l'affiche jamais.

![Écran de passage : à gauche la question « match ou switch » et ses éléments de réponse dépliés, puis la grille Tirage suivant inactive ; à droite l'aperçu de la vue projetée, la carte Note avec les boutons 0 à 2 et « Passer la question », « 2 passes restantes ».](/screenshots/passage-question.png)

## Noter la réponse

Dans la colonne de droite, la carte « Note » rappelle la catégorie et son maximum (« Normal, sur 2 ») et propose un bouton par valeur du barème : `0`, `0,5`, `1`, `1,5`, `2` dans l'exemple ci-dessus. Cliquez sur la valeur qui convient. La note est enregistrée tout de suite, sans confirmation : la question se ferme et la grille se réactive.

Le « Score brut », en haut à droite, additionne les notes des questions déjà notées.

Pour corriger une note, ouvrez le panneau, onglet « Cet étudiant ». La rubrique « Questions » liste les questions de l'étudiant. Chaque question notée a une liste déroulante pour changer sa note. Les « Totaux », en dessous, se recalculent. Ça fonctionne aussi après la fin du passage.

## Passer une question

Le bouton « Passer la question », sous les boutons de note, écarte la question en cours sans la noter. À côté, le nombre de passes restantes s'affiche (« 2 passes restantes »). Il n'apparaît que si les skips sont activés dans la config (`skips.enabled`). Le nombre de passes par étudiant vient de `skips.maxPerStudent` : voir la [référence de la config](./reference-config#skips).

1. Cliquez sur le bouton. Une fenêtre « Passer la question ? » s'ouvre.
2. Choisissez un motif, si vous le souhaitez : un des boutons proposés (`skips.reasons`), ou du texte dans le champ « Autre motif » (si `skips.allowFreeText` l'autorise). Choisir un bouton vide le champ, et inversement. Le motif est facultatif.
3. Cliquez sur « Passer ». Pour renoncer, cliquez sur « Annuler ».

Ce que fait un skip :

- la question ne compte pas dans le passage : l'étudiant devra répondre au même nombre de questions notées (`scoring.questionsPerStudent`) ;
- elle ne sera pas tirée de nouveau pour cet étudiant ;
- **un skip ne s'annule pas** ;
- quand toutes les passes sont utilisées, le bouton reste visible mais inactif, avec « Aucune passe restante », et l'infobulle dit « Plus de passe disponible pour cet étudiant ».

La question passée reste dans le détail du passage, avec la mention « Passée » et son motif (« Passée — Hors programme »), et dans l'export. Voir [Statistiques et export Excel](./stats-export).

## Le commentaire

Dans la colonne de droite, la carte « Commentaire » accepte du texte libre sur l'étudiant en cours. Il s'enregistre tout seul quand vous arrêtez de taper ou quittez le champ. Le message « Enregistrement… » devient « Enregistré » ; en cas de problème, « Échec de l’enregistrement ». Le commentaire est repris dans la colonne « Commentaire » de l'export. Il est conservé si vous réinitialisez l'étudiant ou le déclarez absent.

## Terminer le passage et fixer la note

Le passage est terminé quand l'étudiant a autant de questions **notées** que `scoring.questionsPerStudent`. La pastille « Passage terminé » s'affiche près du titre, et la colonne de gauche montre la note finale sur une jauge, puis le détail des notes, calculées ainsi :

| Ligne | Calcul |
| --- | --- |
| Note brute | Somme des notes des questions. |
| Note plafonnée | Note brute, limitée à `scoring.maxRawScore`. |
| Note convertie | Note plafonnée ramenée à l'échelle finale (`scoring.finalScale`), arrondie selon `scoring.rounding`, entre 0 et l'échelle. |
| Ajustement | Correction manuelle de l'examinateur, « aucun » par défaut. |
| Note finale | Note convertie plus ajustement, arrondie de la même façon, entre 0 et l'échelle. |

Par exemple, avec une note brute maximale de 10 et une échelle de 20, une note brute de 3 donne une note convertie de 6,00. Le détail des arrondis est dans la [référence de la config](./reference-config).

![Passage terminé : la jauge de la note finale 6,00 sur 20 avec « Ajuster la note », les notes brute, plafonnée et convertie, l'ajustement « aucun », puis le début du détail du passage et « Réinitialiser l'étudiant » ; à droite, la vue projetée montre la note.](/screenshots/passage-note-finale.png)

Sous les notes, « Détail du passage » liste chaque question avec sa catégorie, ses points sur le maximum du barème (« 1 / 2 ») et une barre, ou « Passée ».

### La fenêtre « Ajuster la note » {#ajuster-la-note}

Quand le passage se termine, la fenêtre « Ajuster la note » s'ouvre d'elle-même. Elle sert à corriger la note d'un montant que vous choisissez :

- saisissez l'ajustement dans le champ « Ajustement », ou utilisez les boutons « Retirer un pas » et « Ajouter un pas ». Le pas est le pas d'arrondi de la config (0,5 par exemple). La valeur peut être négative. Elle va de moins l'échelle à plus l'échelle ;
- la ligne sous le champ montre le calcul, par exemple « 6,00 + 1,00 = 7,00 / 20 ». Si le résultat sort de l'échelle, il est borné et la ligne l'indique (« bornée à 20 ») ;
- « Justification (facultative) » garde la raison de l'ajustement. Elle apparaît à côté de la ligne « Ajustement » et dans l'export ;
- « Enregistrer » valide la note avec cet ajustement. « Annuler » la valide sans ajustement.

Échap, ou un clic en dehors de la fenêtre, équivaut à « Annuler ». Dans tous les cas, la note est alors considérée comme annoncée : c'est à ce moment que la vue projetée affiche la note finale. Tant que vous n'avez pas fermé la fenêtre, l'étudiant voit seulement « Passage terminé ».

Pour modifier l'ajustement plus tard, cliquez sur « Ajuster la note », au-dessus de la jauge. Saisir 0 supprime l'ajustement et sa justification. Un ajustement n'est possible qu'une fois le passage terminé.

## Étudiant suivant

Cliquez sur « Étudiant suivant », sous le détail du passage. L'application sélectionne le premier étudiant « à passer » ou « en cours » qui suit celui-ci dans la liste, puis reprend au début de la liste si elle arrive au bout. Les étudiants terminés et les absents sont sautés. Quand il n'en reste aucun, le bouton est inactif et le message « Tous les étudiants sont passés » s'affiche.

Changer d'étudiant remet la vue projetée sur l'écran d'attente si elle montrait un autre étudiant. Cliquez sur « Projeter cet étudiant » quand vous voulez montrer le suivant. Voir [Projeter](./projeter).

## Étudiant absent

Pour déclarer un étudiant absent, deux endroits :

- dans le panneau, onglet « Liste », l'icône à droite de sa ligne (« Marquer *nom* absent ») ;
- pour l'étudiant en cours, le bouton « Marquer absent » sous la carte du commentaire.

Si l'étudiant a déjà des questions tirées, une fenêtre « Déclarer … absent ? » prévient que **ces questions seront supprimées**. Le commentaire est conservé. Confirmez avec « Déclarer absent ».

Un absent n'entre pas dans les notes, ni dans les statistiques par question. L'écran de passage affiche « Étudiant absent ». Pour le faire passer finalement, cliquez sur « Marquer présent » : il redevient « à passer », sans question. La façon dont l'absent apparaît dans l'Excel dépend de `absent.export` ([Statistiques et export Excel](./stats-export)).

## Recommencer un étudiant

Une fois le passage terminé, « Réinitialiser l’étudiant », en tête du détail du passage, efface ses questions, ses notes et son ajustement, après confirmation (« Réinitialiser »). Le commentaire est conservé. L'étudiant repart de zéro, et ses questions peuvent être tirées de nouveau.

## Pour la suite

- [Projeter](./projeter) : montrer l'énoncé et la note à l'étudiant.
- [Statistiques et export Excel](./stats-export) : lire les résultats de la session.
- [Créer, reprendre et importer une session](./sessions) : reprendre un oral interrompu.
