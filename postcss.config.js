module.exports = {
  plugins: {
    'postcss-import': {},
    'postcss-cssnext': {
      browsers: [
        '>0.25%',
        'not ie 11',
        'not op_mini all'
      ],
    }
  }
}