import $ from 'blingblingjs'
import { isOffBounds } from './utils'

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
    z-index: 9997;
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
  if (gridlines) {
    gridlines.update = node.getBoundingClientRect()
  }
  else {
    gridlines = document.createElement('pb-gridlines')
    gridlines.position = node.getBoundingClientRect()

    document.body.appendChild(gridlines)
  }
}

const hideGridlines = node => {
  if (!gridlines) return
  gridlines.style.display = 'none'
}