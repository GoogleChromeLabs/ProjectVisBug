import $ from 'blingblingjs'
import { isOffBounds, deepElementFromPoint } from '../utilities/'
import { clearMeasurements } from './measurements'

let gridlines

export function Guides(visbug) {
  $('body').on('mousemove', on_hover)
  $('body').on('mouseout', on_hoverout)

  window.addEventListener('scroll', hideGridlines)
  visbug.onSelectedUpdate(stickGuide)

  return () => {
    $('body').off('mousemove', on_hover)
    $('body').off('mouseout', on_hoverout)

    window.removeEventListener('scroll', hideGridlines)
    visbug.removeSelectedCallback(stickGuide)

    clearMeasurements()
    hideGridlines()
  }
}

const on_hover = e => {
  const target = deepElementFromPoint(e.clientX, e.clientY)
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
    z-index: 2147483643;
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

const stickGuide = els => {
  console.info(els)
}

const on_hoverout = ({target}) =>
  hideGridlines()

const showGridlines = node => {
  if (gridlines) {
    gridlines.style.display = null
    gridlines.update = node.getBoundingClientRect()
  }
  else {
    gridlines = document.createElement('visbug-gridlines')
    gridlines.position = node.getBoundingClientRect()

    document.body.appendChild(gridlines)
  }
}

const hideGridlines = node => {
  if (!gridlines) return
  gridlines.style.display = 'none'
}
