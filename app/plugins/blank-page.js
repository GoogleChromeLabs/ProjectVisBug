export const commands = [
  'empty page',
  'blank page',
  'clear canvas',
]

export default function () {
  document
    .querySelectorAll('body > *:not(vis-bug):not(script)')
    .forEach(node => node.remove())
}
