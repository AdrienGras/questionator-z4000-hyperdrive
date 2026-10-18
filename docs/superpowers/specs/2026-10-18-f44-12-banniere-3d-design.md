# F44.12 — Bannière animée du README en 3D (#156)

Date : 2026-10-18 · Ticket : #156 · Branche : `feat/f44-refonte-ui` (PR #154) · Décisions liées : D100, D102, D110

## Contexte

La bannière animée du README (D100) vient d'une vidéo tournée avant la refonte F44 : elle montre l'ancienne interface. #156 la refait sur l'interface livrée par F44. Le ticket prévoyait le mode « motion » ; la conception ci-dessous en change l'outil (voir « Outil »).

Deux références ont guidé la direction :

- **La vidéo « mode d'emploi en 5 étapes »** (néo-brutaliste, sources GSAP fournies par l'utilisateur, hors dépôt). L'utilisateur la trouve « vraiment bien ». Ce qui la rend claire : une étape = une idée, un gros numéro, un titre de deux mots, une phrase, un vrai écran affiché grand ; une barre de chapitres qui dit où l'on est ; un rythme franc. On en garde la lisibilité, pas le style.
- **Le clip « LGTM (Looks Good to Me) »** (Degenerative Pixels, animé par Claude Opus 5.5 en TypeScript et three.js, <https://www.youtube.com/watch?v=3TNpOD6bov8>). L'utilisateur en retient l'animation, les transitions 3D, les choses qui bougent, le style, les objets 3D : typographie en volume faite de matière (des lettres en lignes de code), caméra qui vole sans coupe sèche, objets 3D lisses présentés comme un dessin technique (vue éclatée annotée), vraies interfaces posées dans la scène, mots qui s'écrivent un à un, palette tenue (un fond nuit, un accent dominant), halo, particules, grain.

Pistes écartées pendant le brainstorming : un remake fidèle de l'ancienne vidéo (trop sage) ; un écran coupé en deux en permanence (interface trop petite en 800 px) ; une borne d'arcade avec carte des niveaux (essayée en storyboard : « on comprend pas du tout », la métaphore cache le produit).

## Intention

En une quarantaine de secondes, quelqu'un qui ouvre le README comprend ce que fait l'application (un oral noté par tirage au sort, sur deux écrans) et voit ce qu'elle offre en plus, sur la vraie interface, avec un film assez beau pour donner envie de cliquer.

## Objectifs

- Montrer le déroulé d'un oral dans l'ordre : préparer, tirer, projeter, noter, statistiques et export.
- Montrer ensuite les autres atouts : l'éditeur de config, l'entraînement en solo, le fonctionnement hors ligne, les données qui restent sur la machine.
- Le faire sur les écrans réels de la refonte, dans l'ambiance de la nouvelle interface.
- Un niveau de finition comparable au clip LGTM : 3D réelle, caméra continue, objets 3D, transitions dans l'espace.

## Non-objectifs

- Pas de son : le README est muet (D100).
- Pas de personnages (l'examinateur et l'étudiant de l'ancienne vidéo disparaissent).
- Pas de version anglaise ni d'autre format (carré, vertical).
- Le texte du README, le guide et ses captures (F44.11, #155) ne bougent pas, sauf le texte alternatif de la bannière.

## Anti-objectifs (échec même si ça marche)

- Une métaphore à décoder (leçon de la borne d'arcade) : chaque plan doit se comprendre sans connaître le produit.
- Un texte illisible dans le README, où la bannière s'affiche en 800 px de large.
- Une interface inventée ou un atout qui n'existe pas : tout ce qui est montré existe dans l'application livrée.
- Un fichier au-delà des seuils de `scripts/readme-banner.test.ts`.
- Un clignotement de plus de trois fois par seconde.

## Contraintes

- **Formats (D100, inchangés)** : AVIF animé 1600 px, 30 i/s, boucle infinie, rendu principal ; WebP animé 800 px en secours ; image fixe WebP 1600 px pour `prefers-reduced-motion`. Seuils du garde-fou : AVIF ≤ 5 Mo, WebP ≤ 5 Mo, image fixe ≤ 200 Ko. L'ancienne pesait 2,5 Mo en AVIF pour 30 s (`libsvtav1`, CRF 38) : 40 s de 3D avec particules et grain se compresseront moins bien, le réglage du CRF et la densité des effets sont à surveiller.
- **Source** : 1920×1080, 30 i/s, environ 40 s. Boucle : la dernière image enchaîne sur la première sans saut.
- **Lisibilité à 800 px** (rapport 0,42 avec la source) : les titres et phrases visés doivent rester lisibles une fois réduits. Le texte d'une interface montrée se lit quand la caméra est assez près ; les micro-détails décoratifs (compteurs, bandeaux monospace) sont de la texture, pas de l'information.
- **Contenu réel** : les données d'exemple sont celles de l'application et de ses captures (« Oral de démonstration · Oral PHP », Alice Durand, catégories Facile / Normal / Difficile / Cauchemar et leurs barèmes, question « match ou switch »…). Aucune donnée, statistique ou fonction inventée.
- **Accessibilité** : l'image fixe dit l'essentiel (titre, promesse, adresse) ; le texte alternatif décrit fidèlement ce que montre la bannière.

## Ce que l'utilisateur a décidé

### Direction : le plan-séquence en 3D

Un plan-séquence dans un vrai espace 3D. Les écrans de la refonte flottent comme des plans ; la caméra vole de l'un à l'autre sans coupe sèche ; à chaque étape un objet 3D « sort » de l'interface. À chaque arrêt, le trio de la vidéo « mode d'emploi » : un numéro, un titre court, une phrase qui s'écrit mot à mot.

### Look : l'ambiance de l'application, dans le style de la nouvelle interface

Fond violet nuit, rose néon, typographie Geist et Geist Mono, cartes arrondies de shadcn, tokens de `src/index.css` en thème sombre (= design system « Questionator Z-4000 », URL dans `docs/ENVIRONMENT.md`). Pas le néo-brutalisme de la vidéo « mode d'emploi ».

### Déroulé (validé : « lgtm »)

Durées indicatives, à ajuster au montage.

| # | Temps | Étape | Ce qu'on voit |
|---|---|---|---|
| 1 | 0–5 s | Ouverture | Des énoncés de questions volent et s'assemblent en lettres 3D « QUESTIONATOR » au-dessus d'un sol en grille ; la caméra plonge à travers le « O ». |
| 2 | 5–10 s | Préparer | `config.json` et `etudiants.csv`, en plaques épaisses, tombent dans l'écran de création de session. Vue éclatée façon dessin technique de la config : catégories, barèmes, questions. |
| 3 | 10–16 s | Tirer | Les quatre tuiles de difficulté se soulèvent comme des cartes, l'une est choisie ; un rouleau de cartes-questions tourne et se retourne sur l'énoncé. |
| 4 | 16–21 s | Projeter | L'écran projeté se détache de l'ordinateur et va se poser sur un grand écran : l'énoncé côté étudiant, la réponse côté examinateur. |
| 5 | 21–25 s | Noter | Un « +2 » en volume part vers le score. |
| 6 | 25–30 s | Statistiques et export | L'histogramme sort de l'écran en barres extrudées ; un classeur `.xlsx` se plie et s'envole. |
| 7 | 30–37 s | Et aussi | La caméra recule et révèle tous les écrans dans l'espace, puis de courtes stations : l'éditeur qui se complète, l'entraînement en solo, une antenne coupée pendant que l'application tourne, et toute la scène qui se referme dans une boîte en fil de fer (« votre machine ») avec un cadenas : rien ne sort. |
| 8 | 37–40 s | Fin | Titre, « Gratuit, open source, hors ligne. », adresse du site. Cette image sert d'image fixe. |

### « Sécurisé » (station 7)

Interprété et validé ainsi : pas de compte, pas de serveur, aucune donnée envoyée, sauvegarde dans un fichier chez l'utilisateur. Ce sont des faits de l'application (README, « 100 % local »).

### Outil : three.js, rendu image par image en local

L'artefact Motion n'embarque pas three.js (DOM, SVG et canvas 2D, rien de chargé de l'extérieur) et le canevas Design n'exporte pas de vidéo. La bannière est donc une page three.js dont tout l'état est une fonction pure du temps `t`, capturée image par image par Playwright puis assemblée par ffmpeg, comme la vidéo « mode d'emploi » (dont `render.py` et la commande ffmpeg servent de modèle). L'écart avec le ticket (mode « motion ») est tracé dans `docs/DECISIONS.md`.

### Sources hors dépôt

Comme pour l'ancienne vidéo (D100), le code de la scène et le script de rendu ne sont pas versionnés : le dépôt ne reçoit que les trois images, le README et la mémoire projet. Les sources sont remises à l'utilisateur en archive (`.zip`, avec un README de rendu, sur le modèle de celle de la vidéo « mode d'emploi »). Conséquences : pas de dépendance `three` dans `package.json`, rien de nouveau pour Sonar, `typecheck`, `lint` ni `deps`. Le travail se fait dans un dossier de travail hors dépôt.

### Pas de passe sur le canevas Design

La règle « canevas avant l'interface » (D102) ne s'applique pas à la bannière : ce n'est pas une interface de l'application, et elle montre des écrans déjà validés sur le canevas. L'exception est notée dans la décision de F44.12. La planche d'images clés est montrée en PNG dans le navigateur (compagnon visuel), pas en artboards.

## Révision après les rendus de validation (2026-10-18)

Le déroulé ci-dessus a évolué sur deux retours de l'utilisateur ; la version livrée (D114) est :

| Temps | Étape | Ce qu'on voit |
|---|---|---|
| 0–5 s | Ouverture | Les énoncés forment « QUESTIONATOR », plongée dans le « O ». |
| 5–10 s | 01 Préparer | `students.example.csv` et `config.example.json` tombent dans l'écran de création ; vue éclatée de la config. |
| 10–16 s | 02 Tirer | Tuiles de difficulté, Normal choisie ; tambour de cartes-questions, « match ou switch ». |
| 16–21 s | 03 Projeter | La vue projetée rejoint le grand écran ; étiquettes « Votre écran » / « Écran projeté ». |
| 21–24 s | 04 Noter | « +1 » vers le score brut (les captures réelles montrent 1 / 2). |
| 24–27 s | Et ainsi de suite | Questions 2 et 3 en accéléré sur les deux écrans (balayages, traînées, pastille « ▶▶ ACCÉLÉRÉ »). |
| 27–31 s | 05 Résultat | Écran final des deux côtés : 6,00 / 20. |
| 31–38,5 s | Et aussi | Cinq objets sur socles, sans écrans : éditeur de config (autocomplétion du schéma), export Excel, révisions en solo, hors ligne, 100 % local ; recul sur les cinq. |
| 38,5–41,5 s | Fin | Titre, Z-4000 HYPERDRIVE, soleil couchant, « Gratuit, open source, hors ligne. », adresse ; image fixe à 39,7 s. |

Retirés en route : l'écran de statistiques et ses anneaux lumineux (« on ne comprend pas ce que ça veut dire »). Durée portée à 41,5 s pour cinq atouts lisibles.

## Mes choix (à vérifier en relisant)

- **Durée** : environ 40 s au lieu de 30, pour la séquence « Et aussi ».
- **Légendes** au vouvoiement, sans genrer l'examinateur, comme l'ancienne bannière et D100.
- **Sol en grille** de l'ouverture : clin d'œil à l'ancienne bannière, traité dans les couleurs de la nouvelle interface ; le soleil synthwave n'apparaît qu'à l'écran de fin, s'il ne jure pas avec le style de la refonte.
- **Textures des écrans** : partir des captures du guide (`site/public/screenshots/*.png`, 2560×1600, thème sombre, données d'exemple réelles), régénérables par `pnpm docs:screenshots`. Les éléments qui s'animent ou sortent de l'écran (tuiles, notes, barres, fichiers) sont redessinés en 3D avec les tokens de l'interface.
- **Validation par étapes** : planche d'images clés soumise à l'utilisateur avant le rendu complet, puis rendu complet, puis vérification sur la page GitHub de la branche (D100 l'a fait pour l'AVIF).

## Ce qui reste au constructeur

- Le découpage du code de la scène, les géométries, matériaux, éclairage, post-traitement (halo, grain), la gestion des polices dans le rendu.
- Le timing fin, les courbes d'accélération, les transitions entre étapes, le texte exact des numéros, titres et phrases (en s'inspirant des légendes de D100 et de la vidéo « mode d'emploi »).
- Le réglage de l'encodage (CRF, préréglage) pour tenir les seuils.
- Le texte alternatif du README, fidèle au nouveau déroulé.

## Critères d'acceptation (repris de #156)

- [ ] Déroulé et rendu validés par l'utilisateur avant l'encodage final.
- [ ] La bannière montre la nouvelle interface, nette et fluide sur GitHub.
- [ ] `scripts/readme-banner.test.ts` vert ; image fixe correcte en mouvement réduit.
- [ ] Texte alternatif fidèle à ce que montre la bannière.
- [ ] Décision tracée dans `docs/DECISIONS.md` (outil three.js au lieu de Motion, sources hors dépôt, exception à D102), mémoire projet à jour (`INDEX.md`, `HANDOFF.md`).
- [ ] Archive des sources remise à l'utilisateur.
