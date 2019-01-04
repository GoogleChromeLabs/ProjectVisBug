import { loadStyles } from '../utilities/styles.js'

export const commands = [
  'debug trashy',
  'debug construct',
]

export default async function() {
  await loadStyles(['https://cdn.jsdelivr.net/gh/t7/construct.css@master/css/construct.debug.css'])
}