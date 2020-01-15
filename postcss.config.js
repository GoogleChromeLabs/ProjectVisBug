const postcssPresetEnv  = require('postcss-preset-env')
const postcssImport     = require('postcss-import')

module.exports = {
  plugins: [
    postcssImport(),
    postcssPresetEnv({
      stage: 0,
      browsers: [
        'last 3 chrome version',
        'last 3 firefox version',
      ],
    }),
  ]
}
