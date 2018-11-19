import resolve  from 'rollup-plugin-node-resolve'
import postcss  from 'rollup-plugin-postcss'

const path_base = 'extension/toolbar'

export default {
  input: `${path_base}/inject.js`,
  output: {
    file:       `${path_base}/content.js`,
    format:     'esm',
    sourcemap:  false,
  },
  plugins: [
    resolve({
      jsnext: true,
    }),
    postcss({
      extract: false,
      inject:  false,
    }),
  ]
}