export const commands = [
  'do a barrel roll',
]

export default async function() {
  document.body.style.transformOrigin = 'center 50vh'
  
  await document.body.animate([
    { transform: 'rotateZ(0)' },
    { transform: 'rotateZ(1turn)' },
  ], { duration: 2000 }).finished

  document.body.style.transformOrigin = ''
}