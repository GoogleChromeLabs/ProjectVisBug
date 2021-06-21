export const commands = [
  'tota11y',
]

export const description = 'inject the tota11y accessibility button on the bottom corner of the page'

export default async function() {
  await import('https://cdnjs.cloudflare.com/ajax/libs/tota11y/0.1.6/tota11y.min.js')
}
