/**
 * Résolution des imports pour dependency-cruiser (`webpackConfig` de `.dependency-cruiser.cjs`) :
 * seule la section `resolve` est lue, webpack n'est pas utilisé. L'alias `@/` reprend le `paths`
 * de `tsconfig.app.json` sans passer par l'option `tsConfig`, qui exige un compilateur TypeScript
 * que dependency-cruiser sait charger (< 7, D94).
 */
const path = require('node:path')

module.exports = {
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.json'],
    alias: { '@': path.join(__dirname, 'src') },
  },
}
