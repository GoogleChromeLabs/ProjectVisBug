import { $$, $ } from 'blingblingjs'
import hotkeys from 'hotkeys-js'
import { getStyle } from './get_style.js'

export function Padding(selector) {
  hotkeys('up,down,left,right,alt+up,alt+down,alt+left,alt+right', (e, handler) => {
    e.preventDefault()
    padElement($$(selector), handler.key)
  })

  return () => hotkeys.unbind('up,down,left,right')
}

export function padElement(els, direction) {
  switch(direction) {
    case 'left': 
      els.forEach(el => 
        el.style.paddingLeft = `${parseInt(getStyle(el, 'paddingLeft'), 10) + 10}px`)
      break

    case 'alt+left':
      els.forEach(el => 
        el.style.paddingLeft = `${parseInt(getStyle(el, 'paddingLeft'), 10) - 10}px`)
      break

    case 'right':
      els.forEach(el => 
        el.style.paddingRight = `${parseInt(getStyle(el, 'paddingRight'), 10) + 10}px`)
      break

    case 'alt+right':
      els.forEach(el => 
        el.style.paddingRight = `${parseInt(getStyle(el, 'paddingRight'), 10) - 10}px`)
      break

    case 'up':
      els.forEach(el => 
        el.style.paddingTop = `${parseInt(getStyle(el, 'paddingTop'), 10) + 10}px`)
      break

    case 'alt+up':
      els.forEach(el => 
        el.style.paddingTop = `${parseInt(getStyle(el, 'paddingTop'), 10) - 10}px`)
      break

    case 'down':
      els.forEach(el => 
        el.style.paddingBottom = `${parseInt(getStyle(el, 'paddingBottom'), 10) + 10}px`)
      break

    case 'alt+down':
      els.forEach(el => 
        el.style.paddingBottom = `${parseInt(getStyle(el, 'paddingBottom'), 10) - 10}px`)
      break
  }
}