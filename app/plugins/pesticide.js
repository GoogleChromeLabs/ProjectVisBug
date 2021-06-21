import { loadStyles } from '../utilities/styles.js'

export const commands = [
  'pesticide',
]

export const description = 'show where the outlines of all elements are, to debug layout'

export default async function() {
  await loadStyles(['https://unpkg.com/pesticide@1.3.1/css/pesticide.min.css'])
}