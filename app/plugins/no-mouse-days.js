export const commands = [
  'no mouse days',
  'disable mouse',
]

export default async function() {
  await import('https://unpkg.com/no-mouse-days@latest')
  window.onload()
}
