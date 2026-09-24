# Décisions produit et techniques

Registre des arbitrages tranchés, du plus ancien au plus récent. Chaque entrée : la
question, la décision, le pourquoi, et où elle est reportée. `PRODUCT.md` reste la
source de vérité ; ce fichier garde la trace de **pourquoi** il dit ce qu'il dit.

Format : `## D<NN> — Sujet (AAAA-MM-JJ)`, puis `**Question**`, `**Décision**`,
`**Pourquoi**`, `**Reporté dans**`.

---

## D01 — Précision numérique des notes : 3 décimales, millièmes, fraction exacte (2026-09-24)

**Question** : `PRODUCT.md` §5 proposait de calculer en millièmes, alors que
`rounding.decimals` acceptait jusqu'à 4 décimales (pas de 0,0001, non représentable en
millièmes). Par ailleurs la conversion `plafonnée × finalScale / maxRawScore` ne tombe
pas forcément sur un nombre entier de millièmes (/20 avec plafond à 7).

**Décision** :
- `rounding.decimals` limité à 0–3.
- Toute valeur numérique de notation (barème, `maxRawScore`, `finalScale`,
  `rounding.step`, `absent.value`, ajustement) a au plus 3 décimales ; erreur de
  validation sinon.
- Notes stockées et additionnées en millièmes entiers.
- Conversion conservée en fraction exacte (numérateur / dénominateur entiers) jusqu'à
  son arrondi au pas demandé (ordre des arrondis : voir D02).

**Pourquoi** : aucune dérive flottante possible, pas de dépendance (pas de lib
décimale), et 3 décimales couvrent largement tout barème d'oral réaliste.

**Reporté dans** : `PRODUCT.md` §5 (précision et représentation), §6.2 (champ
`rounding.decimals`, règle de validation des 3 décimales). Impacte F02 et F03.

## D02 — Arrondi de la convertie avant ajustement, ajustement par pas d'arrondi (2026-09-24)

**Question** : `PRODUCT.md` arrondissait une seule fois, sur la note finale. Avec un pas
de 0,5 et une convertie exacte de 13,3, l'examinateur voyait « 13,5 + 0,2 = 13,5 ».

**Décision** :
- `convertie = arrondi(plafonnée × finalScale / maxRawScore)`.
- `finale = arrondi(clamp(convertie + ajustement, 0, finalScale))`.
- L'ajustement se saisit par multiples du pas d'arrondi. Le second arrondi est un filet
  pour le cas où `finalScale` n'est pas multiple du pas.

**Pourquoi** : le calcul affiché (convertie + ajustement = finale) est toujours exact et
lisible pour l'examinateur. Remplace la mention « un seul arrondi » de D01.

**Reporté dans** : `PRODUCT.md` glossaire (Note finale), §5 étapes 3–4, F11 (popup
d'ajustement), §11 (point retiré). Impacte F03 et F11.

## D03 — Note finale bornée à 0 en bas (2026-09-24)

**Question** : un ajustement négatif peut-il faire passer la note finale sous zéro ?

**Décision** : non, plancher à 0, symétrique du plafond à `finalScale`.

**Pourquoi** : une note négative n'a pas de sens dans un export de notes.

**Reporté dans** : `PRODUCT.md` §5, §11 (point retiré). Impacte F03.

## D04 — Suppression de `categories[].maxPoints`, déduit du barème (2026-09-24)

**Question** : la validation imposait `max(scale) === maxPoints`, le champ était donc
redondant et source d'erreur de saisie.

**Décision** : champ supprimé. La valeur d'une catégorie (« points max ») est
`max(scale)`, partout (tuile, exports, taux de réussite). Nouvelle règle : erreur si
la valeur maximale d'un barème est 0.

**Pourquoi** : `schemaVersion: 1`, aucune config existante à préserver ; un champ
qui doit valoir une autre valeur n'apporte rien.

**Reporté dans** : `PRODUCT.md` exemple de config, tableau des champs §6.2, règles de
validation §6.2, §5 (liste des valeurs à 3 décimales). Impacte F02.

## D05 — Schéma de config strict, `schemaVersion` future bloquante (2026-09-24)

**Question** : la spec prévoyait un avertissement pour une `schemaVersion` supérieure,
sans dire quoi faire des clés inconnues.

**Décision** :
- Schéma Zod strict à tous les niveaux : clé inconnue = erreur avec chemin JSON. Seule
  `$schema` est admise à la racine en plus des champs documentés.
- `schemaVersion` supérieure à la version connue = erreur bloquante, message invitant
  à recharger la page (mise à jour de la PWA).

**Pourquoi** : config écrite à la main, une faute de frappe ignorée retomberait sur le
défaut sans que personne ne le voie. Une version future peut porter une règle de
notation ; l'ignorer produirait de fausses notes. Cohérent avec la liste blanche des
tokens de thème.

**Reporté dans** : `PRODUCT.md` §6.2, règles de validation. Impacte F02.

## D06 — Règle du nombre de questions : globale, plus par catégorie (2026-09-24)

**Question** : exiger `questionsPerStudent + maxPerStudent` questions dans **chaque**
catégorie rendait le grisage d'une catégorie épuisée (F09) inatteignable, et obligeait
à rédiger beaucoup de questions dans les catégories difficiles.

**Décision** :
- Erreur si une catégorie n'a aucune question.
- Erreur si le **total** des questions est inférieur à
  `questionsPerStudent + (skips.enabled ? skips.maxPerStudent : 0)`.
- Une catégorie peut être plus petite que ce seuil ; elle est grisée pour l'étudiant
  qui l'a épuisée.

**Pourquoi** : un enseignant doit pouvoir n'avoir que 2 questions « Cauchemar ». Le
blocage d'un passage reste impossible grâce au seuil global.

**Reporté dans** : `PRODUCT.md` §6.2, règles de validation. Impacte F02 et F09 (le
grisage devient un vrai cas, à tester en parcours).

## D07 — La réinitialisation conserve le commentaire (2026-09-24)

**Question** : « Réinitialiser l'étudiant » effaçait attempts, ajustement et commentaire.

**Décision** : attempts et ajustement supprimés, commentaire conservé.

**Pourquoi** : on réinitialise pour corriger une erreur de manipulation ; le commentaire
porte sur l'étudiant (retard, tiers-temps), pas sur le passage. L'ajustement n'a plus
de sens sans passage.

**Reporté dans** : `PRODUCT.md` F11, §11 (point retiré). Impacte F11.

## D08 — Déclarer absent un passage entamé : confirmation puis réinitialisation (2026-09-24)

**Question** : la spec imposait de réinitialiser manuellement avant de déclarer absent.

**Décision** : bascule directe sans attempt. Avec attempts, une confirmation annonce le
nombre de questions supprimées, puis réinitialise (commentaire conservé, cf. D07) et
marque absent, en une action. Invariant : un étudiant absent n'a jamais d'attempt.

**Pourquoi** : même garantie (pas de note partielle à côté d'un statut absent), sans le
détour en deux actions.

**Reporté dans** : `PRODUCT.md` F12, §11 (point retiré). Impacte F11 et F12.

## D09 — Import de backup conservé dans le périmètre V1 (2026-09-24)

**Question** : seul l'export de backup avait été demandé explicitement.

**Décision** : l'import est gardé (F05).

**Pourquoi** : un backup sans restauration ne couvre ni le cache vidé ni le changement
de machine ; coût faible, la validation Zod de session est partagée avec l'export.

**Reporté dans** : `PRODUCT.md` F05, §11 (point retiré).

## D10 — Statistiques sur un écran dédié, pas dans le side panel (2026-09-24)

**Question** : troisième onglet du side panel, ou écran dédié ?

**Décision** : écran dédié `#/session/:sessionId/stats`, ouvert par un bouton de
l'onglet « Étudiants ». Le side panel garde deux onglets.

**Pourquoi** : histogramme et tableaux ont besoin de place ; les stats se consultent
surtout en fin de session, pas pendant un passage.

**Reporté dans** : `PRODUCT.md` F13, F15, §11 (point retiré). Impacte F13 et F15.

## D11 — Nom de l'examinateur, en colonne dans les exports (2026-09-24)

**Question** : ajouter un champ « examinateur » pour faciliter la fusion des exports
des deux jurys ?

**Décision** : champ facultatif `Session.examiner`, saisi à la création (F06),
modifiable depuis l'accueil (F05). Exporté dans Métadonnées **et en colonne** dans
Synthèse et Détail des questions.

**Pourquoi** : la colonne survit au copier-coller des lignes de deux classeurs dans une
même feuille ; une métadonnée seule non.

**Reporté dans** : `PRODUCT.md` §7 (modèle), F05, F06, F16, §11 (point retiré).

## D12 — Réactivité entre fenêtres vérifiée en F04, plus de spike en F14 (2026-09-24)

**Question** : F14 prévoyait un spike sur la réactivité de `liveQuery` entre fenêtres.

**Décision** : le critère d'acceptation de F04 est ce test (précisé : fenêtre ouverte
par `window.open` comprise). F14 n'ajoute BroadcastChannel que si ce critère échoue.
Correction au passage : ce critère de F04 était annoncé comme prérequis de F13 au lieu
de F14.

**Pourquoi** : Dexie propage nativement `liveQuery` entre contextes de même origine ;
vérifier tôt, dans la feature qui pose la persistance, évite de bloquer F14.

**Reporté dans** : `PRODUCT.md` F04, F14. Impacte F04 et F14.
