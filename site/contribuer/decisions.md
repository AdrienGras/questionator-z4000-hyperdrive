# Décisions

`docs/DECISIONS.md` est le registre des arbitrages tranchés. [`PRODUCT.md`](https://github.com/AdrienGras/questionator-z4000-hyperdrive/blob/main/PRODUCT.md) reste la source de vérité du produit ; le registre garde la trace de **pourquoi** il dit ce qu'il dit, pour qu'on ne rouvre pas une question déjà réglée.

## Une entrée

Les entrées sont classées du plus ancien au plus récent. Chacune s'écrit `## D<NN> — Sujet (AAAA-MM-JJ)`, avec la question, la décision, le pourquoi et, selon les cas, où elle est reportée. Le format est rappelé en tête de [DECISIONS.md](https://github.com/AdrienGras/questionator-z4000-hyperdrive/blob/main/docs/DECISIONS.md). Pour un exemple récent : [D96](https://github.com/AdrienGras/questionator-z4000-hyperdrive/blob/main/docs/DECISIONS.md#d96--f27-71--site-de-documentation-vitepress-2026-10-02), le choix de VitePress.

## Quand en ajouter une

Ajoutez une entrée quand vous tranchez entre plusieurs options viables et qu'un futur contributeur pourrait se demander pourquoi : choix d'un outil, règle d'arborescence, écart au `PRODUCT.md`, compromis assumé. Numérotez-la à la suite de la dernière. Un détail d'implémentation sans alternative réelle n'en demande pas.

## Proposer un arbitrage

Le projet pose deux règles : [`PRODUCT.md`](https://github.com/AdrienGras/questionator-z4000-hyperdrive/blob/main/PRODUCT.md) est la source de vérité produit, et [tout arbitrage est tracé dans `docs/DECISIONS.md`](https://github.com/AdrienGras/questionator-z4000-hyperdrive/blob/main/CLAUDE.md#conventions-du-projet). Le reste est une suggestion, pas une procédure écrite.

Le plus simple : exposez la question et les options dans l'issue du ticket, attendez l'avis du mainteneur, puis ajoutez l'entrée `D<NN>` dans la PR du ticket. Si la décision change le comportement du produit, mettez `PRODUCT.md` à jour dans la même PR.

Le numéro suivant est celui qui suit la dernière entrée du fichier. Les références croisées s'écrivent `D59`, `D96`, comme dans les commentaires du code.

## Pour s'y retrouver

Cherchez par numéro ou par ticket, par exemple `grep -n '^## D5' docs/DECISIONS.md`. L'arborescence de `src/` est justifiée dans [D59](https://github.com/AdrienGras/questionator-z4000-hyperdrive/blob/main/docs/DECISIONS.md#d59--arborescence-de-src--lib-domain-features-sens-des-imports-vérifié-par-dependency-cruiser-2026-09-25). Le fichier est long : lisez les entrées qui vous concernent, pas le registre entier.
