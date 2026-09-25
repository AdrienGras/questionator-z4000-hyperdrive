/**
 * Sens des imports de src/ (#31, D59) : lib ← domain ← components ← features ← routes / app.
 * Détail et raisons : docs/CONVENTIONS.md § « Arborescence et imports ».
 */
const TEST = String.raw`\.test\.tsx?$`

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      comment: 'Aucun cycle entre fichiers.',
      from: {},
      to: { circular: true },
    },
    {
      name: 'no-cross-feature',
      severity: 'error',
      comment: "Une feature n'importe jamais une autre feature : on compose dans routes/.",
      from: { path: '^src/features/([^/]+)/' },
      to: { path: '^src/features/', pathNot: '^src/features/$1/' },
    },
    {
      name: 'domain-is-pure',
      severity: 'error',
      comment:
        'domain/ ne dépend que de domain/ et de la partie pure de lib/ : ni UI, ni base, ni hook.',
      from: { path: '^src/domain/', pathNot: TEST },
      to: {
        path: [
          '^src/(app|routes|features|components|testing)/',
          '^src/lib/db/',
          String.raw`^src/lib/i18n/use-ui\.ts$`,
        ],
      },
    },
    {
      name: 'domain-no-ui-packages',
      severity: 'error',
      comment:
        'domain/ reste sans React ni Dexie (testable et chargeable hors du navigateur). Seule exception : icon-names.ts lit le tableau `iconsList` de Tabler, sans composant (D37).',
      from: {
        path: '^src/domain/',
        pathNot: [TEST, String.raw`^src/domain/config/icon-names\.ts$`],
      },
      to: {
        // pnpm résout vers node_modules/.pnpm/<pkg>@<v>/node_modules/<pkg>/…
        path: '/node_modules/(react|react-dom|dexie|dexie-react-hooks|@tanstack|@base-ui|@tabler/icons-react)/',
      },
    },
    {
      name: 'lib-is-bottom',
      severity: 'error',
      comment: "lib/ n'importe rien de plus haut ; seul lib/db/ lit les types de domain/.",
      from: { path: '^src/lib/', pathNot: TEST },
      to: { path: '^src/(app|routes|features|components|testing)/' },
    },
    {
      name: 'lib-no-domain',
      severity: 'error',
      comment: 'Hors lib/db/, lib/ ignore le métier.',
      from: { path: '^src/lib/', pathNot: ['^src/lib/db/', TEST] },
      to: { path: '^src/domain/' },
    },
    {
      name: 'components-are-shared',
      severity: 'error',
      comment: "components/ est transverse : il n'importe ni feature, ni route, ni app.",
      from: { path: '^src/components/', pathNot: TEST },
      to: { path: '^src/(app|routes|features|testing)/' },
    },
    {
      name: 'features-below-routes',
      severity: 'error',
      comment: "Une feature n'importe ni routes/ ni app/.",
      from: { path: '^src/features/', pathNot: TEST },
      to: { path: '^src/(app|routes)/' },
    },
    {
      name: 'no-barrel',
      severity: 'error',
      comment:
        'Pas de fichier index.ts de réexportation : chaque module s’importe par son chemin direct.',
      from: {},
      to: { path: String.raw`/index\.tsx?$`, pathNot: ['^src/routes/', 'node_modules'] },
    },
    {
      name: 'testing-only-in-tests',
      severity: 'error',
      comment: 'src/testing/ ne sert qu’aux tests.',
      from: { pathNot: [TEST, '^src/testing/'] },
      to: { path: '^src/testing/' },
    },
    {
      name: 'db-singleton',
      severity: 'error',
      comment:
        'Le singleton `db` ne sort pas de lib/db/ : toute écriture passe par updateSession & co. Les imports de type restent libres.',
      from: { pathNot: ['^src/lib/db/', TEST, String.raw`^src/main\.tsx$`] },
      to: { path: String.raw`^src/lib/db/db\.ts$`, dependencyTypesNot: ['type-only'] },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    parser: 'swc',
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.app.json' },
    enhancedResolveOptions: { extensions: ['.ts', '.tsx', '.js', '.json'] },
  },
}
