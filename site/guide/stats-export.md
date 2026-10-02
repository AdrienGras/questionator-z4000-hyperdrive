# Statistiques et export Excel

Cette page décrit l'écran des statistiques d'une session et le fichier Excel qu'on peut en tirer.

## Ouvrir les statistiques

Sur l'écran de passage, cliquez sur « Panneau », ouvrez l'onglet « Étudiants », puis cliquez sur « Statistiques ». Le bouton « Retour au passage » ramène à l'écran précédent.

L'écran reste à jour : si vous faites passer un étudiant dans une autre fenêtre, les chiffres suivent.

![Écran des statistiques : effectifs, notes finales, histogramme et tableau par catégorie.](/screenshots/statistiques.png)

## Ce que montre l'écran

Les blocs se suivent dans cet ordre.

| Bloc | Contenu |
| --- | --- |
| Effectifs | Nombre d'étudiants, terminés, en cours, à passer, absents, et « Ajoutés en séance » (étudiants ajoutés pendant la session). |
| Notes finales | « Étudiants notés », minimum, maximum, moyenne, médiane et écart-type des notes finales. |
| Histogramme | Le nombre d'étudiants par tranche de note finale, en graphique et en tableau (colonnes « Intervalle de notes » et « Étudiants »). |
| Catégories | Pour chaque catégorie : « Choix », « Questions notées » et « Taux de réussite ». |
| Tags | Pour chaque tag des questions : « Questions notées » et « Taux de réussite ». |
| Questions les plus tirées | Les dix questions tirées le plus souvent, avec leur catégorie et le nombre de « Tirages ». |
| Questions passées | Les questions passées au moins une fois : nombre de « Passes » et « Motifs », par exemple « Hors programme ×2, sans motif ×1 ». |
| Stratégies | La composition des passages terminés, par exemple « Facile ×2 · Difficile ×1 », avec le nombre d'étudiants et leur « Note finale moyenne ». |
| Ajustements | « Nombre », « Somme » et « Moyenne » des ajustements non nuls. |

Pour lire les chiffres :

- **Seuls les passages terminés comptent** dans les notes finales, l'histogramme et les stratégies. Un étudiant en cours n'y figure pas.
- **L'histogramme** a une barre par point de note quand l'échelle va jusqu'à 20 (0–1, 1–2, …, 19–20). Au-delà de 20, il a 20 barres de largeur égale. Chaque barre inclut sa borne basse. La dernière inclut aussi la note maximale.
- **Le « Taux de réussite »** est le total des points obtenus divisé par le total des points possibles, sur les questions notées. Un tiret signifie qu'aucune question n'a encore été notée.
- **« Choix »** compte les questions tirées dans la catégorie et notées ou passées. Une question en cours n'y est pas.
- **Les absents** sont comptés dans les effectifs. Leurs questions, s'il en reste, sont ignorées dans les autres blocs.
- Un bloc sans donnée affiche une phrase à la place du tableau, par exemple « Aucune question tirée ».

## Exporter en Excel

Le bouton « Exporter en Excel » télécharge un classeur `.xlsx` avec les résultats de la session. Il existe à deux endroits :

- dans le panneau, onglet « Étudiants », à côté de « Statistiques » ;
- dans le menu « ... » de la carte de la session, sur l'accueil.

Le bouton affiche « Export en cours… » pendant la préparation. Si elle échoue, le message « L'export a échoué. Réessayez. » apparaît.

Le fichier s'appelle `<nom-de-la-session>-<AAAA-MM-JJ>.xlsx`, par exemple `oral-de-demonstration-2026-09-15.xlsx`. Sa langue (noms des feuilles, en-têtes, format des dates) suit celle de la config.

Il contient cinq feuilles, dans cet ordre. Aucune cellule n'est une formule : tout est écrit en valeurs, et un texte comme `=1+1` reste du texte.

### Synthèse

Une ligne par étudiant, dans l'ordre de la liste. La première ligne est figée.

| Colonne | Contenu |
| --- | --- |
| Examinateur | Le nom saisi dans « Modifier l'examinateur », sinon vide. |
| Nom, Prénom | Identité de l'étudiant. |
| Ordre | Rang dans la liste. |
| Statut | « Terminé », « En cours », « À passer » ou « Absent ». |
| Ajouté en cours de session | « Oui » ou « Non ». |
| Brute | Somme des notes des questions. |
| Plafonnée | Note brute limitée à la note brute maximale. |
| Convertie | Note ramenée à l'échelle finale. Vide tant que le passage n'est pas terminé. |
| Ajustement | Ajustement saisi, vide s'il n'y en a pas. |
| Justification | Raison de l'ajustement, si elle existe. |
| Finale | Note finale. Vide tant que le passage n'est pas terminé. |
| Commentaire | Le commentaire de l'examinateur. |

### Détail des questions

Une ligne par question tirée, regroupées par étudiant, dans l'ordre du tirage. La première ligne est figée.

| Colonne | Contenu |
| --- | --- |
| Examinateur | Comme dans la Synthèse. |
| Étudiant | Nom puis prénom. |
| Rang | Position de la question dans le passage, questions passées comprises. |
| Catégorie, Id question, Titre, Tags | La question tirée. |
| Résultat | « Noté », « Passé » ou « En cours ». |
| Points | Points obtenus, vides si la question n'est pas notée. |
| Points max | Le maximum du barème de la catégorie. |
| Motif | Motif du skip, pour une question passée. |
| Tirée le | Date et heure du tirage. |
| Modifiée le | Date et heure de la dernière correction de note, vide si elle n'a pas été corrigée. |

### Statistiques

Les neuf blocs de l'écran des statistiques, l'un sous l'autre, séparés par une ligne vide. Les en-têtes sont ceux de l'écran, avec deux différences. L'histogramme a les colonnes « Intervalle » et « Effectif ». Et un bloc sans donnée (par exemple « Questions passées » quand aucune question n'a été passée) n'affiche pas de phrase comme « Aucune question passée. » : la feuille garde sa ligne de titre et sa ligne d'en-tête, suivies d'une ligne vide.

### Configuration

D'abord le tableau des catégories (« Libellé », « Id », « Ordre », « Questions », « Barème »). Puis les réglages de la session, un par ligne, en deux colonnes « Paramètre » et « Valeur » : questions par étudiant, note brute max, échelle finale, mode et pas d'arrondi, réglages des passes (activées, maximum, motifs, motif libre), réglages des absents (mode, libellé, valeur) et version du schéma.

### Métadonnées

Nom de la session, examinateur, titre de l'examen, matière, promotion, dates de création et d'export, version de l'application.

## Les absents dans l'export

Un étudiant absent a une ligne dans la Synthèse, avec le statut « Absent ». Ses colonnes Brute, Plafonnée, Convertie, Ajustement et Justification sont vides. Seule la colonne « Finale » porte une valeur, qui dépend de `absent.export` dans la config ([référence](./reference-config#absent)) :

| `absent.export` | Colonne « Finale » d'un absent |
| --- | --- |
| `label` (défaut) | Le texte de `absent.label`, `ABS` par défaut. |
| `zero` | Le nombre 0. |
| `value` | Le nombre `absent.value`. |

Un étudiant qui n'a pas terminé son passage a la colonne « Finale » vide. L'application n'invente pas de note pour lui.

## Pour la suite

- [Faire passer un oral](./faire-passer) : comment la note finale est calculée.
- [Créer, reprendre et importer une session](./sessions) : le backup, qui conserve tout, là où l'Excel ne garde que les résultats.
