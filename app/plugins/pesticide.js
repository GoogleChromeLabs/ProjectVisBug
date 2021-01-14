import { loadStyles } from '../utilities/styles.js'

export const commands = [
  'pesticide',
]

export default async function() {
  await loadStyles(['https://unpkg.com/pesticide@1.3.1/css/pesticide.min.css'])
}