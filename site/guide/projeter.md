# Projeter

La vue projetée est une seconde fenêtre faite pour l'étudiant : elle montre l'énoncé de la question et la note, mais jamais la réponse attendue. Vous la placez sur l'écran ou le vidéoprojecteur. Vous gardez votre écran de passage sur l'autre.

## Ouvrir la vue projetée

1. Sur l'écran de passage, cliquez sur « Ouvrir », en haut de la carte « Vue projetée », dans la colonne de droite.
2. Une nouvelle fenêtre s'ouvre. Glissez-la sur le second écran.
3. Cliquez dans la fenêtre projetée, puis sur le bouton « Plein écran », l'icône en haut à droite.

Si le navigateur bloque l'ouverture, le message « Autorisez les fenêtres pop-up pour ce site pour ouvrir la vue projetée » s'affiche. Voir [La vue projetée ne s'ouvre pas](./depannage#projection).

Un second clic sur « Ouvrir » ne crée pas de doublon : il ramène la fenêtre existante au premier plan.

Les deux fenêtres lisent la même base de données, dans le même navigateur. La vue projetée se met à jour d'elle-même à chaque action que vous faites sur l'écran de passage. Ne l'ouvrez donc pas dans un autre navigateur, ni dans une fenêtre de navigation privée.

La fenêtre projetée n'a qu'une commande, le bouton « Plein écran » (puis « Quitter le plein écran »). Il s'efface après trois secondes sans mouvement de la souris, et le curseur disparaît avec lui. Bouger la souris ou appuyer sur Tab le fait revenir.

La vue projetée n'a ni menu ni réglage du mode d'affichage. Elle s'affiche dans le mode fixé par `presentation.defaultColorMode` dans la config (clair, sombre ou celui du système), quel que soit le mode choisi sur votre écran.

## Choisir ce qui est projeté

La vue projetée ne suit pas toute seule l'étudiant que vous faites passer. C'est vous qui décidez, avec les deux boutons sous l'aperçu de la carte « Vue projetée » :

- « Projeter cet étudiant » montre l'étudiant en cours ;
- « Écran d’attente » revient à l'écran neutre.

Quand vous changez d'étudiant (ou cliquez sur « Étudiant suivant ») alors qu'un autre étudiant était projeté, la vue repasse d'elle-même sur l'écran d'attente. Cliquez de nouveau sur « Projeter cet étudiant » pour montrer le suivant. L'étudiant précédent ne reste ainsi jamais à l'écran par oubli.

Si la vue projetée montre un autre étudiant que celui en cours, un message sous les boutons vous le rappelle : « La vue projetée montre *nom*. ». Dans l'onglet « Liste » du panneau, une icône d'écran marque l'étudiant projeté.

## Ce qui est projeté, et quand

### L'écran d'attente

Le titre de l'examen et le message « L'épreuve va bientôt commencer. ». Il s'affiche aussi si l'étudiant projeté est déclaré absent.

### Pendant le passage

![Vue projetée : le titre de l'examen et le nom de l'étudiant, les cartes Question 1 / 3 et Score 0 en haut à droite, les quatre catégories en rangée avec Normal en surbrillance, puis l'énoncé de la question en cours.](/screenshots/vue-projetee.png)

De haut en bas :

- le titre de l'examen et le nom de l'étudiant (prénom puis nom) ; en haut à droite, la carte « Question » (« 1 / 3 ») et, selon la config, la carte « Score » avec le score cumulé ;
- une tuile par catégorie, avec son icône. Avant le tirage, la consigne « Choisissez une catégorie » invite l'étudiant à choisir. Pendant une question, les tuiles passent en rangée compacte : celle de la question en cours est en surbrillance, les autres sont atténuées. Une catégorie qui n'a plus de question pour cet étudiant porte la mention « Épuisée » ;
- l'énoncé de la question en cours, sous la catégorie et sa valeur (« Normal · 2 pts »), sans son titre ni ses éléments de réponse.

### À la fin du passage

Dès la dernière question notée, la vue projetée affiche « Passage terminé », sans les tuiles des catégories. La note n'apparaît qu'après que vous avez fermé la fenêtre « Ajuster la note » avec « Enregistrer » ou « Annuler » ([Faire passer un oral](./faire-passer#ajuster-la-note)). Elle s'affiche sur une jauge et contient alors l'ajustement.

## Les réglages `presentation`

Le bloc `presentation` de la config règle ce que l'étudiant voit. Chaque champ est décrit dans la [référence de la config](./reference-config#presentation). Voici leur effet sur la vue projetée.

| Champ | Valeur par défaut | Effet |
| --- | --- | --- |
| `showCumulativeScore` | `true` | Affiche la carte « Score » à côté de la carte « Question », pendant le passage. Elle disparaît à la fin. Si vous voulez que l'étudiant ignore ses points avant la fin, mettez `false`. |
| `showCategoryPoints` | `true` | Affiche le maximum de points de chaque catégorie sur sa tuile (« 3 pts »). Avec `false`, seuls le nom et l'icône restent. |
| `drawAnimation` | `true` | Au tirage, trois cartes se mélangent pendant environ une seconde et demie, puis l'énoncé apparaît. Si le système demande de réduire les animations, un simple fondu les remplace. Rien ne s'anime à l'ouverture de la fenêtre ni au changement d'étudiant. |
| `finalScoreDisplay` | `both` | Une fois la note validée : `converted` affiche la jauge de la « Note » (6,00 / 20), `raw` affiche le « Score brut » (3), `both` affiche les deux. |
| `showStatsOnFinal` | `false` | Ajoute sous la note le « Détail par question » : une ligne par question, avec l'icône et la couleur de sa catégorie, son titre et ses points (« 1 / 2 »), ou « Passée ». Les motifs de skip n'y figurent pas. |
| `defaultColorMode` | `system` | Mode d'affichage de la vue projetée, toujours : clair, sombre ou celui du système. C'est aussi le mode de départ de votre écran de passage, que vous pouvez changer dans le menu. |

`finalScoreDisplay` ne change que la vue projetée. Votre écran de passage montre toujours toutes les notes.

La « Note » projetée est la note finale : note convertie plus ajustement. Le « Score brut » est la somme des points, sans plafond.

## L'aperçu

En haut de la colonne de droite de l'écran de passage, la carte « Vue projetée » reproduit en réduit ce que montre la fenêtre. Il suit la projection : si vous n'avez pas cliqué sur « Projeter cet étudiant », il affiche l'écran d'attente. Vous pouvez donc vérifier ce que l'étudiant verra avant de le lui montrer. Il n'anime pas le tirage.

## Ce que l'étudiant ne voit jamais

La fenêtre projetée ne reçoit qu'une version réduite de la session. N'y figurent ni les éléments de réponse, ni le titre de la question en cours, ni la note de chaque question pendant le passage, ni les ajustements et leur justification, ni les commentaires, ni les motifs de skip, ni les autres étudiants. Une seule exception : le score cumulé laisse deviner la note de la question qui vient d'être notée, si `showCumulativeScore` est actif.

## Pour la suite

- [Faire passer un oral](./faire-passer) : le déroulé côté examinateur.
- [Référence de la config](./reference-config#presentation) : les champs `presentation`.
