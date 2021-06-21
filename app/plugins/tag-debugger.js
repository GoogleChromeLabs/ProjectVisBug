// https://gist.github.com/addyosmani/fd3999ea7fce242756b1
export const commands = [
  'tag debugger',
  'osmani',
]

export const description = 'outline every DOM element with a random color, to visualize layout'

export default async function() {
  let i, A;
  for (i = 0; A = document.querySelectorAll('*')[i++];)
    A.style.outline = `solid hsl(${(A+A).length*9},99%,50%) 1px`
}