# F44 — Refonte UI (thème sombre, navigation, passe UX) — Design

- **Date** : 2026-10-14
- **Ticket** : #143 à #152, puis #155 et #156 (découpage, voir « Découpage »)
- **Branche** : une seule branche d'intégration pour tous les tickets, une seule PR vers `main` (voir D102)
- **Statut** : design validé en conversation, figé ici avant le découpage en tickets et le plan d'implémentation.

## Contexte

L'application a été montée sur shadcn/ui avec ses tokens par défaut : neutres `oklch` sans teinte, Geist, `--radius` à 0.625rem (`src/index.css`). L'utilisateur aime le squelette shadcn, mais le rendu est noir et blanc, sans personnalité. L'identité visuelle existe pourtant ailleurs (bannière du README, D100 : rose `#ff2d95`, violet nuit `#1a1033`, ambiance synthwave), et l'app n'en reprend rien.

La navigation est en étoile : l'accueil est le seul point d'entrée, chaque écran y renvoie (8 liens `to="/"`), et passer d'un espace à l'autre impose de repasser par lui. Il n'y a pas de menu.

L'accueil empile quatre cartes d'action de même poids (nouvelle session, restaurer, éditer une config, s'entraîner), avec trois boutons primaires concurrents et beaucoup de texte. Le panneau « Aucune session » occupe les deux tiers de l'écran sans rien proposer. Les usages examinateur et étudiant y sont mélangés.

Références : `src/index.css` · `src/lib/appearance/` · `src/components/session-appearance.tsx`, `theme-scope.tsx` · `src/routes/` · `examples/config.example.json` (`theme`, `categories[].color`, `categories[].icon`) · `playwright.screenshots.config.ts`, `e2e/screenshots/` · `docs/CONVENTIONS.md` § « Arborescence et imports », « Vue de session thémée » · D26, D59, D60, D99, D100.

## Objectif

L'application a une identité visuelle propre, sombre et discrète, où la couleur porte du sens, et l'on circule entre ses espaces sans repasser par l'accueil. **Le fond ne bouge pas** : chaque écran fait exactement ce qu'il fait aujourd'hui. **La forme bouge franchement** : style, hiérarchie, disposition des pages, navigation.

## Buts, non-buts, anti-buts

**Buts**
- Un thème sombre unique, cohérent sur tous les écrans, tiré d'un design system explicite (tokens, composants).
- Un menu permanent qui donne accès directement aux grands espaces.
- Une vraie passe UX sur la disposition de chaque page : hiérarchie claire, une action principale par écran, moins de texte, des états vides qui guident.
- La couleur comme repère : une teinte par espace de l'app, et les couleurs de catégorie (déjà dans la config) réellement exploitées.

**Non-buts**
- Aucune fonctionnalité ajoutée, retirée ou modifiée. Les seules routes nouvelles (`/sessions`, `/trainings`) accueillent des listes qui existent déjà sur l'accueil : du contenu déplacé, pas de fonctionnalité nouvelle.
- Pas de changement dans `src/domain/` ni dans le schéma de config.
- Pas de mode clair pendant la refonte (il revient dans le dernier ticket, voir D102).

**Anti-buts** (ce qui ferait échouer la refonte même si tout marche)
- Une app « tout violet » ou saturée de dégradés : le dégradé doit rester une touche.
- De la couleur décorative qui ne désigne rien.
- Une app à moitié refaite en production pendant des semaines.
- Le thème d'une session (bloc `theme` de la config) qui n'a plus de prise sur l'interface.
- Une police ou une ressource chargée depuis le réseau : l'app est 100 % locale et fonctionne hors ligne.

## Décisions (D102)

| Sujet | Décision | Raison |
|---|---|---|
| Mode de couleur | Thème sombre uniquement pendant la refonte. Le mode clair revient dans le **dernier ticket**, par dérivation du thème sombre (on inverse grosso modo les couleurs, sans refonte). | Concentrer l'effort sur une seule identité ; les salles d'oral de l'utilisateur supportent une projection sur fond noir. |
| Schéma de config | Inchangé : `theme.light`, `theme.dark` et `presentation.defaultColorMode` restent valides. Pendant la refonte, le mode sombre est forcé et le bouton clair/sombre retiré ; le dernier ticket les réactive. | Aucune config existante ne casse. |
| Livraison | Une branche d'intégration unique, une seule PR vers `main` qui ferme tous les tickets de la phase 3 (`Closes #a`, `Closes #b`…). Dérogation assumée à « une PR par ticket » (CLAUDE.md). | Chaque merge sur `main` déploie en production (`ci.yml`, job `deploy`) : il ne faut pas exposer une app à moitié refaite. |
| Navigation | Un menu permanent, le même pour tous (l'app n'a pas de comptes, elle ne sait pas qui l'utilise), présent sur tous les écrans sauf la vue projetée. | L'examinateur et l'étudiant qui s'entraîne circulent tous les deux entre plusieurs espaces. |
| Accueil et pages d'espace | L'accueil est éclaté : chaque espace a sa page (`/sessions` : liste, création, restauration ; `/trainings` : liste, nouvel entraînement). L'accueil devient un **tableau de bord** qui montre ce que le menu ne montre pas : reprise des dernières sessions et du dernier entraînement avec leur état, tuiles colorées par espace avec un chiffre et « voir tout », premier lancement guidé. La duplication avec le menu est assumée. | Le menu a besoin de destinations propres ; l'accueil garde une raison d'exister en orientant au lieu de tout lister. |
| Couleur | Deux registres : **une couleur d'action** unique, en dégradé sur les boutons principaux, et **une palette multicolore codée** pour ce qui désigne quelque chose (espaces de l'app, catégories, scores, jauges). | Ce que l'utilisateur a retenu dans les références (voir « Direction visuelle »). |
| Thème de session | Tout ce que la refonte ajoute (dégradés, halos, teintes de surface) se construit à partir des tokens shadcn (`--primary`, `--accent`, `--card`…), jamais en couleurs codées en dur. | Le bloc `theme` d'une config surcharge ces tokens dans les écrans de session (D26) : il doit continuer de piloter l'interface. |
| Squelette | shadcn/ui et Tailwind v4 restent la base ; la refonte passe par les tokens de `src/index.css` et les composants de `src/components/ui/`, puis par la disposition de chaque écran. | L'utilisateur aime le squelette shadcn ; c'est le rendu qu'il veut changer. |
| Couleurs d'espace *(choix de Claude)* | Des tokens propres (`--space-*` ou équivalent) définis dans `src/index.css`, **hors** du thème de session : une config ne peut pas les surcharger (le schéma `theme` est limité aux tokens shadcn et ne change pas). Le reste du menu (surfaces, texte, lien actif) utilise les tokens shadcn (`sidebar-*`…) et suit donc le thème de session. | Le code couleur des espaces sert de repère : il doit rester stable d'une session à l'autre. La règle « tout dérive des tokens » vise ce que le thème de session doit piloter (action, surfaces, halos), pas les repères de navigation. |
| Tests et libellés *(choix de Claude)* | Les tests qui vérifient une disposition, une structure ou un libellé sont adaptés à la nouvelle forme ; ceux qui vérifient un comportement (règles, données, parcours) ne changent pas d'intention. Les chaînes i18n peuvent être raccourcies, réécrites ou supprimées, en français et en anglais ensemble. | « Le fond ne bouge pas, la forme oui » : figer les tests de forme interdirait la passe UX. |
| Le canevas, référence de création | À partir de F44, le canevas et le design system sont la référence de toute création d'interface. Chaque nouvelle feature qui touche l'interface passe par une passe sur le canevas : spec validée → artboards de la feature validés par l'utilisateur → plan → code. Si l'implémentation s'écarte de la maquette, l'artboard est mis à jour dans la même PR. Le design system est la référence des tokens ; `src/index.css` lui correspond. Les tickets sans interface (domaine, stockage, CI) n'ont pas de passe sur le canevas. | Sans cette règle, le canevas est périmé dès la feature suivante et la cohérence visuelle obtenue par la refonte se perd. |
| Branche des phases 1 et 2 *(choix de Claude)* | Ce document, D102 et les mises à jour de `INDEX.md` et `HANDOFF.md` partent dans une PR de documentation, mergée avant la phase 1. Les arbitrages de la phase 2 sont les premiers commits de la branche d'intégration. | Pas de push direct sur `main`, et pas de PR parallèles sur `DECISIONS.md` et `HANDOFF.md`. |

## Direction visuelle

Références retenues par l'utilisateur, avec ce qu'on leur prend :

| # | Référence | Ce qu'on en prend |
|---|---|---|
| 2 | [Fleety TMS Dashboard](https://dribbble.com/shots/27302894-Fleety-TMS-Dashboard-Dark-Mode) | Interface sombre dense, un seul accent. |
| 4 | [ZusGPT Subscription Dashboard](https://dribbble.com/shots/27426819-ZusGPT-Subscription-Dashboard) | La couleur réservée aux actions principales. |
| 6 | [Coinstax, état vide](https://dribbble.com/shots/26470157-Coinstax-Portfolio-Empty-State-Dark-Mode) | Un état vide qui liste les premières étapes. |
| 7 | [Sidebar Empty State](https://dribbble.com/shots/27747367-Dark-Mode-Sidebar-Navigation-Empty-State-UI) | **Fort** : menu latéral avec icônes en tuiles colorées. |
| 8 | [Knowledge Base Empty State](https://dribbble.com/shots/27706566-AI-Knowledge-Base-Empty-State-Dark-SaaS-Dashboard) | **Fort** : halo coloré flou en fond, un seul appel à l'action centré. |
| 9 | [ATS Scoring Dashboard](https://dribbble.com/shots/27755413-AI-Resume-Analyzer-ATS-Scoring-Dashboard-B2B-SaaS-UI-Kit) | Scores en anneaux, chiffres colorés. |
| 10 | [Fluently, statistiques](https://dribbble.com/shots/25481212-Fluently-app-Language-score-statistics) | **Référence principale** : fond presque noir teinté de violet, palette multicolore pour les données, un bouton d'action franc, arrondis généreux, chiffres en grand, peu de texte, interface claire. |

Écartées : Linear (trop austère), dégradés en fond généralisés, apps de quiz grand public (trop ludiques et saturées).

Ce que ça donne, en principe (à préciser en phase 2) :
- **Fond** : presque noir, légèrement teinté de violet (dans l'esprit du `#1a1033` du README, sans faire un fond violet). Cartes à peine plus claires, qui se détachent par la lumière plus que par des bordures. Halos colorés flous ponctuels (réf. 8).
- **Action** : une couleur franche en dégradé sur le bouton principal de chaque écran ; les autres boutons restent sobres.
- **Palette codée** : une teinte par espace (icône du menu, accueil, en-tête de l'espace) ; les couleurs de catégorie de la config sur les tuiles, les stats et la vue projetée ; des anneaux et des jauges pour les scores.
- **Formes** : arrondis généreux, chiffres en grand et en gras, hiérarchie nette (titre fort, sous-texte gris), peu de texte.

## Navigation

- **Menu latéral permanent** (réf. 7) : Accueil, Sessions (`/sessions`), Éditeur de config (`/editor`), Entraînement (`/trainings`), plus l'aide. Chaque espace a son icône dans une tuile de sa couleur ; le lien actif couvre les sous-écrans de l'espace (`/session/…` et `/new` sous Sessions, `/training/…` sous Entraînement).
- **Pages d'espace** : `/sessions` reprend la liste des sessions, la création (lien vers `/new`), la restauration d'une sauvegarde (dépôt de fichier compris) et les sessions endommagées ; `/trainings` reprend la liste des entraînements, le lancement (`/training/new`) et les entraînements endommagés. Les composants viennent de `features/home` et sont redistribués (une feature par écran, D59).
- **Accueil** (tableau de bord) : il cesse d'être un passage obligé. Il montre ce que le menu ne montre pas :
  - **reprendre** : les dernières sessions et le dernier entraînement, avec leur état (étudiants passés sur le total, taux de réussite), cliquables directement ;
  - **les espaces en tuiles colorées** (réf. 7), chacune avec un chiffre et un « voir tout » vers sa page ;
  - **un premier lancement guidé** (réf. 6, 8) : sans aucune donnée, les étapes (télécharger les exemples, créer une session, s'entraîner) au lieu d'un panneau vide.
- **Vue projetée** (`/present/$sessionId`) : jamais de menu, elle reste plein écran dans sa propre fenêtre.
- **Écran de notation** : le menu reste visible pour l'examinateur pendant l'oral.
- La forme exacte du menu (repliable ou non, comportement en largeur étroite) se décide sur le canevas en phase 2.

## Collision de couleurs à tester

Les couleurs des espaces sont choisies par nous ; les couleurs de catégorie sont choisies par l'auteur de chaque config (`categories[].color`), donc arbitraires. L'écran de session affiche les deux. En phase 2, le canevas doit confronter les couleurs des espaces à **plusieurs jeux de catégories quelconques** (dont celui de `examples/config.example.json` et au moins un jeu volontairement proche des couleurs d'espace). On tranche ensuite entre deux familles distinctes (pleines contre douces, par exemple) et un code d'espace plus discret.

## Phases et outils

Artifacts des phases 1 et 2 (privés, URL aussi dans `docs/ENVIRONMENT.md`) : [canevas Design](https://claude.ai/artifact/DvvtZZb9ie2vknoXtHfnJL) et [design system « Questionator Z-4000 »](https://claude.ai/artifact/DMYaQZGYtm8RnJqbBMmBcy). La [carte des écrans](2026-10-17-f44-carte-des-ecrans.md) relie chaque artboard validé au code et aux tickets de la phase 3.

### Phase 1 — Inventaire

- Un **canevas Design** (Artifact de type Design, privé) : un artboard par écran et par état clé (liste ci-dessous), redessiné fidèlement à partir du code source.
- À côté de chaque artboard, la **capture réelle** de l'écran, produite par `pnpm docs:screenshots` (données d'exemple, rendu figé) passé en mode sombre pour l'occasion, et déposée sur le canevas. C'est la référence exacte de l'« avant ».
- Une **planche de références** (le tableau ci-dessus) sur le même canevas.
- Aucun code dans le dépôt, hors l'éventuel réglage temporaire des captures (non commité).

### Phase 2 — Design system et refonte des maquettes

- Un **Design System** (Artifact de type Design System) : tokens (couleurs du thème sombre, couleurs d'espace, typo, espacements, rayons), composants avec aperçus (boutons, cartes, tuiles, menu, anneaux, jauges, dialogues) et règles d'usage. Il part des tokens actuels, puis évolue.
- Les artboards de la phase 1 sont **redessinés** avec ce design system : nouvelle navigation, nouvelle disposition, nouveau style.
- L'utilisateur itère en commentant sur le canevas ; les arbitrages (dont la collision de couleurs) sont tracés dans `DECISIONS.md`.
- La phase 2 se termine quand l'utilisateur valide les maquettes. Le découpage de la phase 3 est alors confirmé ou ajusté.

### Phase 3 — Implémentation

- Lecture des artboards validés et traduction dans le code : tokens dans `src/index.css`, composants de `src/components/ui/`, menu et coquille de page, puis disposition écran par écran. Pas de copier-coller du HTML des maquettes.
- Sur la branche d'intégration, un groupe de commits par ticket ; l'utilisateur valide chaque ticket en local (`pnpm dev`) avant le suivant.

## Inventaire des écrans (phase 1)

Les noms de captures renvoient à `site/public/screenshots/` (produites par `pnpm docs:screenshots`).

| Route | Écran | États clés |
|---|---|---|
| `/` | Accueil (`features/home`) | aucune session (`accueil.png`), sessions et entraînements listés (`accueil-sessions.png`), session ou entraînement endommagé, dialogue de suppression, dépôt d'une sauvegarde |
| `/new` | Création de session (`features/create-session`) | dépôt des fichiers, aperçus étudiants et config (`creation-session.png`), avertissements et erreurs (`creation-avertissements.png`) |
| `/editor` | Éditeur de config (`features/config-editor`) | éditeur, liste d'erreurs, aperçu de question (`editeur-config.png`) |
| `/session/$sessionId` | Session examinateur (`features/session`) | liste des étudiants, tirage par catégorie, question et barème (`passage-question.png`), panneau latéral (`passage-panneau.png`), note finale et ajustement (`passage-note-finale.png`), absent, question passée, dialogues (ajout d'étudiant, ajustement, passage, réinitialisation), contrôles de projection, export |
| `/present/$sessionId` | Vue projetée (`features/present`, `components/projection`) | attente, tuiles de catégories, animation de tirage, question (`vue-projetee.png`), carte finale |
| `/session/$sessionId/stats` | Statistiques de session (`features/stats`) | histogramme, tableaux (`statistiques.png`), aucune donnée |
| `/training/new`, `/training/$trainingId/update` | Mise en place de l'entraînement (`features/training-setup`) | étape du prompt, étape de la config (`entrainement-mise-en-place.png`), résumé de mise à jour |
| `/training/$trainingId` | Entraînement (`features/training`) | tuiles, question, réponse révélée, notation (`entrainement-question.png`) |
| `/training/$trainingId/stats` | Stats d'entraînement (`features/training-stats`) | chiffres clés, taux par catégorie et par tag (`entrainement-stats.png`), aucune donnée |
| transverse | Coquille et bandeaux | en-tête (aide, bascule de mode), bandeau d'état de la base, bandeaux hors ligne et mise à jour, session endommagée, repli |

En phase 2 seulement (elles n'existent pas encore) : les artboards de `/sessions`, `/trainings`, de l'accueil en tableau de bord (avec données, et premier lancement) et du menu.

## Contraintes

- **Hors ligne et 100 % local** : toute nouvelle police s'installe en paquet (`@fontsource…`, comme Geist aujourd'hui), jamais par Google Fonts ni un CDN. Les maquettes du canevas peuvent utiliser Google Fonts ; le code, non.
- **Arborescence (D59)** : le menu et la coquille vont dans `src/components/` (partagés), jamais dans une feature ; pas d'import entre features ; `pnpm deps` vert.
- **Accessibilité** : contraste texte 4.5:1 (3:1 au-delà de 24 px) sur le fond sombre, y compris le texte gris secondaire et le texte posé sur un dégradé ; couleurs distinguées aussi par la luminosité ; menu navigable au clavier.
- **i18n** : l'app est en français et en anglais ; les maquettes sont en français, le code garde les deux langues et la longueur des libellés anglais est prise en compte dans les mises en page.
- **Projection** : lisible de loin sur fond sombre (taille, contraste) ; aucun menu.
- **Thème de session** : la config d'exemple (`examples/config.example.json`, bloc `theme.dark`) est mise à jour pour illustrer le nouveau style, et une config sans bloc `theme` doit rendre le thème par défaut de la refonte.

## Tests

- La suite de tests (unitaires et e2e) reste verte. Elle cible des rôles et des textes : un changement de style ne la casse pas ; un changement de libellé ou de structure, si, et le test de forme concerné est alors adapté (voir D102, « Tests et libellés »). Un test de comportement qui casse signale une régression, pas un test à réécrire.
- Le menu, la coquille et tout nouveau composant ont leurs tests (navigation, lien actif, absence sur la vue projetée, accès clavier).
- La couverture du nouveau code reste à 80 % au moins sur la PR unique (gate Sonar, D99).
- Pas de test de régression visuelle dans le dépôt aujourd'hui : la comparaison se fait sur le canevas (avant / après) et par la validation de l'utilisateur à chaque ticket.

## Découpage

| # | Ticket | Livrable | Fermeture |
|---|---|---|---|
| 1 (#143) | Inventaire des écrans | Canevas : artboards, captures, planche de références | à la main, après validation |
| 2 (#144) | Design system et maquettes | Artifact Design System, artboards redessinés, arbitrages dans `DECISIONS.md` | à la main, après validation |
| 3 (#145) | Tokens et composants de base | `src/index.css`, `components/ui/`, thème sombre forcé, bascule de mode retirée | PR unique |
| 4 (#146) | Menu et coquille de page | Menu latéral, coquille commune, liens « retour à l'accueil » revus | PR unique |
| 5 (#147) | Accueil et pages d'espace | `/sessions`, `/trainings`, accueil en tableau de bord, premier lancement guidé | PR unique |
| 6 (#148) | Création de session et éditeur | Disposition des deux écrans | PR unique |
| 7 (#149) | Session examinateur et vue projetée | Disposition, tuiles et scores, projection | PR unique |
| 8 (#150) | Statistiques | Stats de session et d'entraînement | PR unique |
| 9 (#151) | Entraînement | Mise en place, entraînement | PR unique |
| 10 (#152) | Mode clair dérivé | Thème clair par dérivation du sombre, bascule réactivée, `defaultColorMode` de nouveau effectif | PR unique |
| 11 (#155) | Guide, captures et README | Guide utilisateur et contributeur, captures régénérées, texte du README | PR unique |
| 12 (#156) | Bannière animée du README | Vidéo refaite depuis les artboards (mode « motion » du canevas), formats de D100 | PR unique |

Le découpage des tickets 3 à 10 a été **confirmé tel quel** à la fin de la phase 2 (D103) : les stats d'entraînement vont avec #150, la mise en place et l'écran d'entraînement avec #151. Le détail par écran est dans la [carte des écrans](2026-10-17-f44-carte-des-ecrans.md). Les tickets 11 et 12 ont été ajoutés pendant la phase 3 (D110) : la documentation et la bannière décrivent encore l'interface d'avant.

**Branche et PR** : la branche d'intégration part de `main` à jour au début de la phase 3. La PR est ouverte en brouillon dès le premier commit de code, pour que Sonar analyse chaque poussée ; elle passe en « Ready for review » une fois le ticket 12 fait, CI et Sonar verts, et n'est mergée qu'avec le go explicite de l'utilisateur.

## Mémoire et documentation

- `docs/DECISIONS.md` : D102 (ce document), plus les arbitrages de la phase 2.
- `CLAUDE.md` : la règle « passe sur le canevas pour toute feature qui touche l'interface » (D102).
- `docs/ENVIRONMENT.md` : les URL du canevas et du design system, dès leur création.
- `docs/CONVENTIONS.md` : tokens et palette (registres de couleur, couleurs d'espace, règle « tout dérive des tokens »), menu et coquille de page.
- `docs/INDEX.md`, `docs/HANDOFF.md` : à chaque étape.
- Guide utilisateur (`site/guide/`) : captures régénérées par `pnpm docs:screenshots` en fin de phase 3, textes qui décrivent la navigation mis à jour.
- `site/contribuer/` : renvoi vers les conventions de style, sans duplication.

## Critères d'acceptation et vérification

- Chaque écran de l'inventaire correspond à son artboard validé en phase 2.
- Aucune fonctionnalité ne change : toute la suite de tests passe, et un parcours manuel complet (création de session, oral avec projection, stats, export, entraînement) se déroule comme avant.
- Le menu est présent sur tous les écrans sauf la vue projetée, et permet d'aller d'un espace à l'autre sans repasser par l'accueil.
- Tout ce que l'accueil actuel permet (lister, ouvrir, supprimer, restaurer par bouton ou par dépôt, signaler une session endommagée) reste possible depuis `/sessions` et `/trainings`.
- Une config avec un bloc `theme.dark` personnalisé change bien l'apparence des écrans de session, dégradés et halos compris.
- Contrastes conformes sur le fond sombre ; aucune requête réseau ajoutée (vérifiable hors ligne).
- Après le ticket 10 : le mode clair fonctionne, la bascule et `defaultColorMode` sont de nouveau effectifs.

## Laissé au constructeur

- Le choix exact des teintes, de la typo (garder Geist ou en ajouter une de titre) et des rayons, à proposer sur le canevas.
- La forme exacte du menu (repliable, largeur étroite) et l'attribution des couleurs d'espace.
- Le niveau de détail des artboards de dialogues secondaires (un artboard par dialogue, ou une planche qui les regroupe).
