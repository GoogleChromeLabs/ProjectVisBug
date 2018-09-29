import resolve from 'rollup-plugin-node-resolve'
import postcss from 'rollup-plugin-postcss'

export default {
  input: 'app/index.js',
  output: {
    file: 'app/bundle.js',
    format: 'es',
    sourcemap: 'inline',
  },
  plugins: [
    resolve({
      jsnext: true,
    }),
    postcss({
      extract: false,
      inject:  false,
    })
  ],
  watch: {
    exclude: ['node_modules/**'],
  }
}