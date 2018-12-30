export default function() {
  document
    .querySelectorAll('body > *:not(tool-pallete):not(script)')
    .forEach(node => node.remove())
}