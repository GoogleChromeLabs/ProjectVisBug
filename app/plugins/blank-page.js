export default function() {
  document
    .querySelectorAll('body > *:not(pb-gridlines):not(script):not(tool-pallete)')
    .forEach(node => node.remove())
}