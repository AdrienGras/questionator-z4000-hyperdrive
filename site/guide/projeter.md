# Projeter

La vue projetée est une seconde fenêtre faite pour l'étudiant : elle montre l'énoncé de la question et la note, mais jamais la réponse attendue. Vous la placez sur l'écran ou le vidéoprojecteur. Vous gardez votre écran de passage sur l'autre.

## Ouvrir la vue projetée

1. Sur l'écran de passage, cliquez sur « Ouvrir la vue projetée », au-dessus de l'aperçu, à droite.
2. Une nouvelle fenêtre s'ouvre. Glissez-la sur le second écran.
3. Cliquez dans la fenêtre projetée, puis sur le bouton « Plein écran » en haut à droite.

Si le navigateur bloque l'ouverture, le message « Autorisez les fenêtres pop-up pour ce site pour ouvrir la vue projetée » s'affiche. Voir [La vue projetée ne s'ouvre pas](./depannage#projection).

Un second clic sur « Ouvrir la vue projetée » ne crée pas de doublon : il ramène la fenêtre existante au premier plan.

Les deux fenêtres lisent la même base de données, dans le même navigateur. La vue projetée se met à jour d'elle-même à chaque action que vous faites sur l'écran de passage. Ne l'ouvrez donc pas dans un autre navigateur, ni dans une fenêtre de navigation privée.

Dans la fenêtre projetée, deux boutons apparaissent en haut à droite : « Plein écran » (puis « Quitter le plein écran ») et le mode d'affichage clair, sombre ou système. Ils s'effacent après trois secondes sans mouvement de la souris, et le curseur disparaît avec eux. Bouger la souris ou appuyer sur Tab les fait revenir. Le mode d'affichage de départ vient de `presentation.defaultColorMode` dans la config.

## Choisir ce qui est projeté

La vue projetée ne suit pas toute seule l'étudiant que vous faites passer. C'est vous qui décidez, avec les deux boutons sous l'aperçu :

- « Projeter cet étudiant » montre l'étudiant en cours ;
- « Écran d’attente » revient à l'écran neutre.

Quand vous changez d'étudiant (ou cliquez sur « Étudiant suivant ») alors qu'un autre étudiant était projeté, la vue repasse d'elle-même sur l'écran d'attente. Cliquez de nouveau sur « Projeter cet étudiant » pour montrer le suivant. L'étudiant précédent ne reste ainsi jamais à l'écran par oubli.

Si la vue projetée montre un autre étudiant que celui en cours, un message sous les boutons vous le rappelle : « La vue projetée montre *nom*. ». Dans la liste « Étudiants » du panneau, une icône d'écran marque l'étudiant projeté.

## Ce qui est projeté, et quand

### L'écran d'attente

Le titre de l'examen et le message « L'épreuve va bientôt commencer. ». Il s'affiche aussi si l'étudiant projeté est déclaré absent.

### Pendant le passage

![Vue projetée : le titre de l'examen, le nom de l'étudiant, les quatre catégories avec leur maximum de points, l'énoncé de la question en cours, Question 1 / 3 et Score : 0.](/screenshots/vue-projetee.png)

De haut en bas :

- le titre de l'examen et le nom de l'étudiant (prénom puis nom) ;
- une tuile par catégorie. La catégorie de la question en cours a une bordure épaisse. Une catégorie qui n'a plus de question pour cet étudiant est en pointillés, avec la mention « Épuisée ». Les autres sont atténuées tant qu'une question est en cours ;
- l'énoncé de la question en cours, sans son titre ni ses éléments de réponse ;
- la progression, « Question 1 / 3 » ;
- le score cumulé, « Score : 0 », selon la config.

### À la fin du passage

Dès la dernière question notée, la vue projetée affiche « Passage terminé ». Les tuiles sont marquées « Indisponible » (ou « Épuisée » pour une catégorie sans question restante). La note n'apparaît qu'après que vous avez fermé la fenêtre « Ajuster la note » avec « Enregistrer » ou « Annuler » ([Faire passer un oral](./faire-passer#ajuster-la-note)). Elle contient alors l'ajustement.

## Les réglages `presentation`

Le bloc `presentation` de la config règle ce que l'étudiant voit. Chaque champ est décrit dans la [référence de la config](./reference-config#presentation). Voici leur effet sur la vue projetée.

| Champ | Valeur par défaut | Effet |
| --- | --- | --- |
| `showCumulativeScore` | `true` | Affiche « Score : *n* » sous la progression, pendant le passage. Il disparaît à la fin. Si vous voulez que l'étudiant ignore ses points avant la fin, mettez `false`. |
| `showCategoryPoints` | `true` | Affiche le maximum de points sous le nom de chaque catégorie (« 3 pts »). Avec `false`, seuls le nom et l'icône restent. |
| `drawAnimation` | `true` | Au tirage, trois cartes se mélangent pendant environ une seconde et demie, puis l'énoncé apparaît. Si le système demande de réduire les animations, un simple fondu les remplace. Rien ne s'anime à l'ouverture de la fenêtre ni au changement d'étudiant. |
| `finalScoreDisplay` | `both` | Une fois la note validée : `converted` affiche « Note : 6 / 20 », `raw` affiche « Score brut : 3 », `both` affiche les deux. |
| `showStatsOnFinal` | `false` | Ajoute sous la note le détail du passage : une ligne par question, avec sa catégorie, son titre et ses points (« 1 / 2 »), ou « Passée ». Les motifs de skip n'y figurent pas. |
| `defaultColorMode` | `system` | Mode d'affichage de départ : clair, sombre ou celui du système. |

`finalScoreDisplay` ne change que la vue projetée. Votre écran de passage montre toujours toutes les notes.

La « Note » projetée est la note finale : note convertie plus ajustement. Le « Score brut » est la somme des points, sans plafond.

## L'aperçu

À droite de l'écran de passage (sous la grille, sur un petit écran), l'aperçu « Vue projetée » reproduit en réduit ce que montre la fenêtre. Il suit la projection : si vous n'avez pas cliqué sur « Projeter cet étudiant », il affiche l'écran d'attente. Vous pouvez donc vérifier ce que l'étudiant verra avant de le lui montrer. Il n'anime pas le tirage.

## Ce que l'étudiant ne voit jamais

La fenêtre projetée ne reçoit qu'une version réduite de la session. N'y figurent ni les éléments de réponse, ni le titre de la question en cours, ni la note de chaque question pendant le passage, ni les ajustements et leur justification, ni les commentaires, ni les motifs de skip, ni les autres étudiants. Une seule exception : le score cumulé laisse deviner la note de la question qui vient d'être notée, si `showCumulativeScore` est actif.

## Pour la suite

- [Faire passer un oral](./faire-passer) : le déroulé côté examinateur.
- [Référence de la config](./reference-config#presentation) : les champs `presentation`.
