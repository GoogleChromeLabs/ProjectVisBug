const postcssPresetEnv  = require('postcss-preset-env')
const postcssImport     = require('postcss-import')

module.exports = {
  plugins: [
    postcssImport(),
    postcssPresetEnv({
      stage: 0,
      browsers: [
        '>0.25%',
        'not ie 11',
        'not op_mini all',
      ],
    }),
  ]
}