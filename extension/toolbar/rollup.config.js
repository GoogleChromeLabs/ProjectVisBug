const path_base = 'extension/toolbar'

export default {
  input: `${path_base}/inject.js`,
  output: {
    file:       `${path_base}/content.js`,
    format:     'esm',
    sourcemap:  false,
  }
}