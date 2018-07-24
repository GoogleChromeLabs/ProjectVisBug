import $ from 'blingblingjs'

let live_tips = []

const template = ({y,x,content}) => {
  let span = document.createElement('span')

  span.classList.add('metatip')
  span.style = `
    top: ${y}px;
    left: ${x}px;
  `
  span.textContent = content

  return span
}

export function MetaTip(selected) {
  live_tips.forEach(tip => tip.remove())

  live_tips = selected.map(el => {
    const { x, y, width } = el.getBoundingClientRect()
    // todo: get meaningful content by comparing selected node with tool choice
    // insert nasty switch here
    const tip = template({
      y, 
      x: x + width / 2, 
      content: 'test'
    })
    document.body.appendChild(tip)
    return tip
  })
}