# F44 — Carte des écrans : maquettes validées face au code

- **Date** : 2026-10-17
- **Tickets** : clôt la phase 2 (#144) et sert de référence aux tickets de la phase 3 (#145 à #152, puis #155 et #156 pour la documentation, D110)
- **Spec parente** : `2026-10-14-f44-refonte-ui-design.md`
- **Décision** : D103
- **Canevas** : page « Après » (URL dans `docs/ENVIRONMENT.md`), 29 artboards

Cette carte confronte chaque artboard validé au code de `src/`. Elle dit, écran par écran, ce qui ne change que de forme, ce qui change de libellé ou de place, ce qui est nouveau, et ce que le code fait sans que la maquette le montre. Les arbitrages sont dans D103 ; ce document en donne le détail par ticket.

Règle de lecture : **le code fait foi pour tout comportement que la maquette ne montre pas**. Un état non maquetté (erreur, chargement, liste vide, état désactivé) se conserve tel quel, restylé avec les composants du design system.

## Écrans, routes et tickets

| Espace | Artboards | Route | Feature actuelle | Ticket |
|---|---|---|---|---|
| Menu et coquille | `menu-replie`, `bandeaux` | toutes sauf `/present` | `components/page-shell.tsx`, `routes/__root.tsx` | #146 |
| Accueil | `accueil`, `accueil-premier-lancement`, `accueil-en`, `accueil-dialogues` | `/` | `features/home` | #147 |
| Sessions | `sessions` | `/sessions` (nouvelle) | composants de `features/home` déplacés | #147 |
| Entraînements | `trainings` | `/trainings` (nouvelle) | composants de `features/home` déplacés | #147 |
| Création de session | `creation-session`, `creation-avertissements` | `/new` | `features/create-session` | #148 |
| Éditeur de config | `editeur-config` | `/editor` | `features/config-editor` | #148 |
| Passage | `passage-question`, `passage-panneau`, `passage-panneau-etudiant`, `passage-note-finale`, `passage-question-theme`, `session-dialogues` | `/session/$sessionId` | `features/session` | #149 |
| Vue projetée | `projection-attente`, `projection-tuiles`, `projection-tirage`, `projection-question`, `projection-finale`, `projection-finale-detail` | `/present/$sessionId` | `features/present`, `components/projection` | #149 |
| Statistiques de session | `statistiques`, `stats-vide` | `/session/$sessionId/stats` | `features/stats` | #150 |
| Stats d'entraînement | `entrainement-stats` | `/training/$trainingId/stats` | `features/training-stats` | #150 |
| Entraînement | `entrainement-mise-en-place`, `entrainement-mise-a-jour`, `entrainement-question` | `/training/new`, `/training/$trainingId/update`, `/training/$trainingId` | `features/training-setup`, `features/training` | #151 |

## Transverse (#145, #146)

- **Menu latéral** (nouveau, prévu par D102) : Accueil, intertitre « Espaces », Sessions, Éditeur de config, Entraînement, Aide en pied, puis « Replier le menu ». Replié à 72 px : icônes seules, infobulles au survol et au focus, séparateur à la place de l'intertitre. L'état replié est mémorisé sur l'appareil (`localStorage`, lecture protégée). Le lien actif couvre les sous-routes de son espace.
- **Aide** : quitte l'en-tête de page pour le pied du menu. **Bascule de thème** : retirée pendant la refonte (D102), elle revient au ticket 10 en pied de menu, au-dessus de « Replier le menu ».
- **Marque** : « Questionator Z-4000 » dans le menu ; `app_title` garde le nom complet ailleurs.
- **Fil d'Ariane** : remplace les liens « Retour à l'accueil » des écrans d'un espace (`Sessions › <nom de session> · <titre de l'oral>`). Les écrans hors espace gardent un lien retour.
- **Bandeaux** (`db-status-banner`, `update-prompt`, `offline-ready-prompt`, `damaged-session`, `session-fallback`) : forme seule. Les messages « hors ligne » et « base » sont découpés en titre et corps ; « Détails » de la session endommagée affiche le nombre de problèmes ; « Session introuvable » passe son retour en bouton principal.
- **Chevrons dessinés** à la place des triangles natifs sur tous les `<details>`.
- **Libellés** : « backup » devient « sauvegarde » dans toutes les chaînes FR (`home_import`, `action_export`, `delete_export_first`, `import_drop_hint`, `empty_body`, `persistence_warning`, `damaged_body`…). « Dernière activité » reste (« séance » serait faux : la date change aussi au remplacement de la config).

## Accueil, Sessions, Entraînements (#147)

**Forme seule** : créer une session, reprendre, stats d'un entraînement, ouvrir l'éditeur, importer une sauvegarde (bouton et dépôt n'importe où), menus « … » des cartes (Renommer, Modifier l'examinateur, Exporter, Exporter en Excel, Supprimer ; Mettre à jour la config, Supprimer), badge « Endommagée », tri par date (`record-order.ts`).

**Nouveau, retenu** :
- **Accueil en tableau de bord** : section « Reprendre » = les **3 éléments les plus récents, sessions et entraînements confondus, endommagés exclus** ; tuiles « Espaces » avec compteurs (`sessions.length`, `trainings.length`) et « Voir tout ».
- **Premier lancement** affiché quand il n'y a **aucune session et aucun entraînement**, avec le badge « Stockage non garanti » s'il y a lieu.
- **Taux de réussite global d'un entraînement** (anneau sur les cartes) : nouveau calcul dans `domain/training`, même définition que les taux « Par niveau » de `computeTrainingStats`, appliquée à toutes les questions.
- Progression des cartes de session découpée : « 7 / 24 passés » puis « 2 absents · 15 restants » (`sessionProgress` fournit tout). Couverture d'un entraînement en compte : « 38 / 60 questions notées » (`coverage` existe). Date courte sans année sur l'accueil (nouveau format dans `lib/format-date.ts`).
- Pages `/sessions` et `/trainings` : en-tête d'espace, compteur « N sessions · dernière modification d'abord », encart permanent de dépôt d'une sauvegarde sur `/sessions`. Sur une carte endommagée, l'action utile sort du menu « … » en bouton visible (Exporter pour une session, Supprimer pour un entraînement).

**À conserver, non maquetté** : stockage indisponible (actions masquées, import désactivé), bandeau de base à la place de la liste, liste vide, export Excel en cours ou en échec, entraînement dont le journal n'est pas encore chargé. Les dialogues (renommer, examinateur, suppressions, erreur et conflit d'import, voile de dépôt, entraînement endommagé) sont sur l'artboard `accueil-dialogues`.

**Perdu volontairement** : les textes d'explication des anciennes cartes d'action (`home_*_body`), remplacés par des sous-titres courts. Le format attendu du CSV et de la config reste décrit sur l'écran de création et dans la documentation.

## Création de session et éditeur (#148)

**Forme seule** : zones de dépôt et leurs états, liens d'exemple, nom de session, examinateur (avec « Repris en colonne dans les exports »), résumé complet de la config dans l'aperçu, « Voir la liste », clic sur un problème qui amène à la ligne, soulignement ondulé, ligne active, aperçu dans le thème et la langue de la config, « Écran final ».

**Modifié** : texte d'état des zones de dépôt visible à l'écran ; bordure colorée selon l'état ; libellés courts (« Liste d'exemple », « Charger »…) avec le libellé long en `aria-label` ; « (facultatif) » dans le libellé de l'examinateur (la clé `examiner_hint` sert aussi au dialogue « Modifier l'examinateur ») ; résumé de config en lignes intitulé / valeur ; barème formaté selon la langue (« 0,5 ») dans les deux aperçus ; panneau « Problèmes » **au-dessus** du code ; « Créer une session avec cette config » dans l'en-tête de page.

**Nouveau, retenu** :
- Création : une phrase sous le bouton désactivé, **une par cause** (CSV en erreur, config invalide, nom vide, base fermée), compteur « N erreurs à corriger » et libellé « Erreur » sur chaque erreur de config, icône et couleur de catégorie dans le résumé.
- Éditeur : navigation par catégorie dans l'aperçu (ancres, compteurs, « Écran final ») ; numéro de ligne sur chaque problème (calculé sur le texte validé) ; nom de fichier affiché en titre de la frame, **dérivé du titre comme pour « Télécharger »** (`configFileName`), sans nouvel état.

**À conserver, non maquetté** : marqueurs de problème dans la marge (`lintGutter`, ajoutés à l'artboard), « Aucune erreur », aperçu périmé et aperçu vide, erreurs de lecture, de validateur et d'écriture, contour pendant le dépôt, infobulles et autocomplétion, avertissements d'une config valide sur `/new`, « Skips désactivés », état désactivé de « Créer une session » dans l'éditeur.

## Passage et vue projetée (#149)

**Forme seule** : catégorie, titre et énoncé ; « Éléments de réponse » **repliés à chaque question** (D28) ; barème en boutons ; tuiles de tirage ; miniature live de la projection (un seul rendu partagé, `projection-canvas.tsx`) ; « Cet étudiant », « Écran d'attente », « Ouvrir » ; commentaire avec « Enregistré » ; « Marquer absent » ; passes restantes ; liste des étudiants avec statuts, scores, icône projeté, restauration d'un absent ; « Ajouter et faire passer » ; motifs de skip de la config et « Autre motif » ; ajustement −/+ avec justification ; échec d'écriture ; écran d'attente ; plein écran qui s'efface après 3 s.

**Modifié** :
- Le `h1` devient le nom de l'étudiant ; le barème, le skip, le commentaire et « Marquer absent » passent dans la colonne de droite, sous la carte « Vue projetée » qui reste en tête.
- **Notation en un clic, inchangée** : un bouton du barème note et ferme la question, il n'y a pas d'état « sélectionné ».
- Onglets du panneau « Cet étudiant » / « Liste » ; l'onglet « Cet étudiant » garde **la correction d'une note déjà donnée** (`<select>`, action `editScore`) et les totaux (artboard `passage-panneau-etudiant`).
- Détail du passage : une question passée garde son motif (« Passée — motif »), hors note.
- Notes affichées partout selon l'arrondi de la config (`domain/scoring/format.ts`), y compris sur la projection (aujourd'hui `Intl` à 2 décimales max).
- Projection : « Question » et « Score » en cartes en haut à droite ; rangée compacte des catégories pendant une question ; « Passage terminé » affiché avec la note révélée ; plus de tuiles de catégories sur l'écran final ; consigne « Choisissez une catégorie ».
- Dialogue d'ajout d'étudiant : « Annuler » en texte au lieu de la croix ; champ d'ajustement signé à 2 décimales.

**Nouveau, retenu** : barre de progression segmentée par catégorie ; maximum brut (« / 10 ») ; résumé « N étudiants · N terminés · N absents » dans le panneau ; titre « Tirage suivant » et son indice ; jauges de note finale ; barres par question dans le détail ; étiquette de langage des blocs de code ; placeholder « Précisez » ; **couleur et icône de catégorie dans le détail final projeté** (ajout de `categoryId` à `ProjectedView.detail`, D69 élargie, D103).

**Refusé** : le titre de la question sur la projection. Il peut souffler la réponse (« Portée et closures ») et demanderait d'élargir la liste blanche D69 ; la projection montre l'en-tête de catégorie et l'énoncé, comme aujourd'hui.

**À conserver, non maquetté** : animation de tirage (artboard `projection-tirage`, instant figé ; fondu en mouvement réduit), libellés « Épuisée » / « Indisponible » des tuiles, bandeau « la projection montre un autre étudiant », pop-up bloquée, alertes d'erreur de page et de tiroir, aucun étudiant, étudiant absent, grille entre deux questions, quota de skip atteint, « Tous les étudiants sont passés », note non encore révélée, ouverture automatique de l'ajustement en fin de passage (D66), messages d'ajustement invalide ou borné.

## Statistiques (#150)

**Forme seule** : toutes les données affichées existent déjà (`domain/stats/*`, `domain/training/training-stats.ts`) : effectifs, moyenne, médiane, histogramme, minimum, maximum, écart-type, ajustements, réussite par catégorie (notées, choix), questions les plus tirées, questions passées et motifs, stratégies, tags, chiffres clés, taux par niveau et par notion, « À revoir », détail par question.

**Modifié** : bloc « Synthèse » (Étudiants, Passés, Absents, Moyenne et Médiane « / 20 ») avec barre empilée et légende ; histogramme et carte des notes fusionnés ; anneaux pour la réussite par catégorie et par niveau ; colonnes réordonnées ; histogramme et anneaux accessibles par `aria-label` (phrases) au lieu des tableaux `sr-only`.

**Comportements conservés** : tags dans **l'ordre de la config** ; détail des stats d'entraînement trié **« à revoir » en tête**, puis ordre de la config.

**Nouveau, retenu** :
- **État vide global** des stats de session, affiché seulement quand **aucun étudiant n'a de tentative** ; dès qu'une question est tirée, la page normale s'affiche avec ses messages vides par bloc.
- Sous-titre « Statistiques · <titre> · <matière> · <promotion> », colonne « Part » des questions les plus tirées, compteur « N questions » à revoir.

**Perdu volontairement** : infobulle, axe Y et grille de l'histogramme (Recharts pourra être retiré si plus rien ne s'en sert).

## Entraînement (#151)

**Forme seule** : étapes et textes de la mise en place, note « effort de réflexion maximal », prompt et « Copier le prompt », « C'est parti » désactivé sans config valide, « Mettre à jour la config », « Voir les stats », « Notez-vous », « Passer », bilan de mise à jour (conservées, nouvelles, retirées).

**Modifié** : bloc « Réponse » **repliable** après révélation (« Masquer »), barème compris ; en-tête « Normal · 2 pts » ; « Notez-vous · sur 2 » ; compteurs par catégorie en pastilles ; collage du JSON dans un repli « … ou collez le JSON ici » (avec « Vérifier » à l'intérieur).

**Nouveau, retenu** :
- **Étapes à état** (faite, en cours, à venir), **indicatives seulement** : toutes restent actives, la config peut se déposer d'emblée (« Choisir un fichier » visible à l'étape 4). Après copie, l'étape 2 se résume (« Prompt copié. · Copier à nouveau ») et le prompt reste accessible dans un repli « Afficher le prompt », pour le secours « copiez à la main ».
- Tuiles de catégories visibles et désactivées pendant une question, la catégorie courante marquée.

**À conserver, non maquetté** : avant révélation (« Voir la réponse »), tuiles seules, question disparue, alertes d'erreur, liste d'erreurs de config et « Corriger dans l'éditeur », erreur d'écriture, bandeau de base, état vide des stats d'entraînement.

## Nouvelles chaînes i18n

Chaque écran ajoute des sous-titres et quelques libellés courts (« Synthèse », « Détail », « Tirage suivant », « Problèmes », « Copier à nouveau », « Afficher le prompt », « Ajoutées au tirage », « ou déposez-en un autre », textes de l'état vide des stats, du premier lancement et du menu). Plusieurs phrases existantes sont découpées (`card_progress`, `preview_scoring`, `preview_rounding`, `preview_skips`, `preview_category`, `preview_students_count`, `offline_ready`, `db_outdated`, `db_unavailable`, `training_update_*`). FR et EN évoluent ensemble (D102).
