import resolve from 'rollup-plugin-node-resolve'

export default {
  input: 'app/index.js',
  output: {
    file: 'app/bundle.js',
    format: 'es'
  },
  plugins: [
    resolve({
      jsnext: true,
    })
  ],
  watch: {
    exclude: ['node_modules/**'],
  }
}