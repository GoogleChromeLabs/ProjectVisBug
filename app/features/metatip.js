import $ from 'blingblingjs'

const template = ({target: el, pageX, pageY}) => {
  const { width, height } = el.getBoundingClientRect()
  let metatip = document.createElement('div')

  metatip.classList.add('metatip')
  metatip.style = `
    top: ${pageY + 75}px;
    left: ${pageX + 75}px;
  `
  metatip.innerHTML = `
    <h5>${el.nodeName.toLowerCase()}${el.id && '#' + el.id}${el.className && '.'+el.className.replace(/ /g, '.')}</h5>
    <small>${Math.round(width)}px x ${Math.round(height)}px</small>
  `
  // <ol>styles_list</ol>

  return metatip
}

export function MetaTip() {
  let tip_map = {}

  $('body > *:not(script):not(tool-pallete)').on('mousemove', e => {
    if (e.target.hasAttribute('data-selected')) return

    if (tip_map[e.target]) {
      const tip = tip_map[e.target]
      tip.style.top = `${e.pageY + 75}px`
      tip.style.left = `${e.pageX + 75}px`
      return
    }

    const tip = template(e)
    document.body.appendChild(tip)

    $(e.target).on('mouseout click', e => {
      if (!tip_map[e.target]) return

      tip_map[e.target].remove()
      delete tip_map[e.target]
    })

    tip_map[e.target] = tip
  })
}