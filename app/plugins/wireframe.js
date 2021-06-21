export const commands = [
  'wireframe',
  'blueprint',
]

export const description = 'turn the page into a blueprint wireframe'

export default async function() {
  const styles = `
    *:not(path):not(g) {
      color: hsla(210, 100%, 100%, 0.9) !important;
      background: hsla(210, 100%, 50%, 0.5) !important;
      outline: solid 0.25rem hsla(210, 100%, 100%, 0.5) !important;
      box-shadow: none !important;
    }
  `

  const style = document.createElement('style')
  style.textContent = styles
  document.head.appendChild(style)
}