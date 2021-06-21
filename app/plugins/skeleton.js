export const commands = [
  'skeleton',
  'outline',
]

export const description = 'turn everything into wireframe boxes'

export default async function() {
  const styles = `
    *:not(path):not(g) {
      color: hsl(0, 0%, 0%) !important;
      text-shadow: none !important;
      background: hsl(0, 0%, 100%) !important;
      outline: 1px solid hsla(0, 0%, 0%, 0.5) !important;
      border-color: transparent !important;
      box-shadow: none !important;
    }
  `

  const style = document.createElement('style')
  style.textContent = styles
  document.head.appendChild(style)
}