export const commands = [
  'do a barrel role',
]

export default async function() {
  document.body.style.transformOrigin = 'center 50vh'
  
  await document.body.animate([
    { transform: 'rotateZ(0)' },
    { transform: 'rotateZ(1turn)' },
  ], { duration: 2500 }).finished

  document.body.style.transformOrigin = ''
}