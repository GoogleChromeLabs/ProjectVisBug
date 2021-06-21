export const commands = [
  'no mouse days',
  'disable mouse',
]

export const description = 'disable your mouse cursor (e.g. to test keyboard-only support for accessibility)'

export default async function() {
  await import('https://unpkg.com/no-mouse-days@latest')
  window.onload()
}
