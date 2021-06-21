export const commands = [
  'remove css',
  'disable css',
]

export const description = 'remove the style and link tags from the page'

export default function () {
  [
    ...document.querySelectorAll('style'),
    ...document.querySelectorAll('link'),
  ].forEach((el) => el.remove())

  document
    .querySelectorAll('[style]:not(vis-bug)')
    .forEach((el) => el.removeAttribute('style'))
}
