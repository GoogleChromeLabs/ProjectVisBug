export const commands = [
  'barrel roll',
  'do a barrel roll',
]

export const description = 'spin the page once'

export default async function() {
  document.body.style.transformOrigin = 'center 50vh'
  
  await document.body.animate([
    { transform: 'rotateZ(0)' },
    { transform: 'rotateZ(1turn)' },
  ], { duration: 1500 }).finished

  document.body.style.transformOrigin = ''
}