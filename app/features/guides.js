import $ from 'blingblingjs'
import { isOffBounds, htmlStringToDom } from './utils'

let gridlines

export function Guides() {
  $('body').on('mouseover', on_hover)
  $('body').on('mouseout', on_hoverout)

  return () => {
    $('body').off('mouseover', on_hover)
    $('body').off('mouseout', on_hoverout)
    hideGridlines()
  }
}

const on_hover = ({target}) => {
  if (isOffBounds(target)) return
  showGridlines(target)
}

export function createGuide(vert = true) {
  let guide = document.createElement('div')
  let styles = `
    position: absolute;
    top: 0;
    left: 0;
    background: hsla(330, 100%, 71%, 70%);
    pointer-events: none;
    z-index: 99999999;
  `

  vert 
    ? styles += `
        width: 1px;
        height: 100vh;
        transform: rotate(180deg);
      `
    : styles += `
      height: 1px;
      width: 100vw;
    `

  guide.style = styles

  return guide
}

// export function Guides() {
//   let v = createGuide()
//     , h = createGuide(false)

//   document.body.appendChild(v)
//   document.body.appendChild(h)
//   document.body.style.cursor = 'crosshair'

//   const mouseMove = e => {
//     v.style.left  = e.clientX + 'px'
//     h.style.top   = e.clientY + 'px'
//   }

//   $('body').on('mousemove', mouseMove)

//   return () => {
//     $('body').off('mousemove', mouseMove)
//     document.body.removeChild(v)
//     document.body.removeChild(h)
//     document.body.style.cursor = null
//   }
// }

const on_hoverout = ({target}) =>
  hideGridlines()

const showGridlines = node => {
  const { x, y, width, height, top, left } = node.getBoundingClientRect()
  const winHeight = window.innerHeight
  const winWidth = window.innerWidth

  if (gridlines) {
    gridlines.style.display = 'block'
    gridlines.children[0].setAttribute('width', width + 'px')
    gridlines.children[0].setAttribute('height', height + 'px')
    gridlines.children[0].setAttribute('x', left)
    gridlines.children[0].setAttribute('y', top)
    gridlines.children[1].setAttribute('x1', left)
    gridlines.children[1].setAttribute('x2', left)
    gridlines.children[2].setAttribute('x1', left + width)
    gridlines.children[2].setAttribute('x2', left + width)
    gridlines.children[3].setAttribute('y1', top)
    gridlines.children[3].setAttribute('y2', top)
    gridlines.children[4].setAttribute('y1', top + height)
    gridlines.children[4].setAttribute('y2', top + height)
  }
  else {
    gridlines = htmlStringToDom(`
      <svg 
        class="pb-gridlines"
        style="position:fixed;top:0;left:0;overflow:visible;pointer-events:none;z-index:998;" 
        width="100%" height="100%" 
        viewBox="0 0 ${winWidth} ${winHeight}" 
        version="1.1" xmlns="http://www.w3.org/2000/svg"
      >
        <rect 
          stroke="hotpink" fill="none"
          width="${width}" height="${height}"
          x="${x}" y="${y}" 
          style="display:none;"
        ></rect>
        <line x1="${x}" y1="0" x2="${x}" y2="${winHeight}" stroke="hotpink" stroke-dasharray="2" stroke-dashoffset="3"></line>
        <line x1="${x + width}" y1="0" x2="${x + width}" y2="${winHeight}" stroke="hotpink" stroke-dasharray="2" stroke-dashoffset="3"></line>
        <line x1="0" y1="${y}" x2="${winWidth}" y2="${y}" stroke="hotpink" stroke-dasharray="2" stroke-dashoffset="3"></line>
        <line x1="0" y1="${y + height}" x2="${winWidth}" y2="${y + height}" stroke="hotpink" stroke-dasharray="2" stroke-dashoffset="3"></line>
      </svg>
    `)

    document.body.appendChild(gridlines)
  }
}

const hideGridlines = node => {
  if (!gridlines) return
  gridlines.style.display = 'none'
}