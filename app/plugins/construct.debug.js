import { loadStyles } from '../utilities/styles.js'

export const commands = [
  'debug trashy',
  'debug construct',
]

export const description = 'visualize the semantic structure of the page (loads construct.css)'

export default async function() {
  await loadStyles(['https://cdn.jsdelivr.net/gh/t7/construct.css@master/css/construct.debug.css'])
}