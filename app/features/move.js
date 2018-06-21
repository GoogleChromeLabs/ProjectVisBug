import { $$, $ } from 'blingblingjs'
import hotkeys from 'hotkeys-js'

export function Moveable(selector) {
  hotkeys('up,down,left,right', (e, handler) => {
    e.preventDefault()
    moveElement($(selector), handler.key)
  })

  return () => hotkeys.unbind('up,down,left,right')
}

export function moveElement(el, direction) {
  if (!el) return

  switch(direction) {
    case 'left':
      if (el.previousElementSibling)
        el.parentNode.insertBefore(el, el.previousElementSibling)
      break

    case 'right':
      if (el.nextElementSibling && el.nextElementSibling.nextSibling)
        el.parentNode.insertBefore(el, el.nextElementSibling.nextSibling)
      else if (el.nextElementSibling)
        el.parentNode.appendChild(el)
      break

    case 'up':
      if (el.parentNode && el.parentNode.parentNode && el.parentNode.nodeName != 'BODY')
        el.parentNode.parentNode.prepend(el)
      break

    case 'down':
      if (!el.nextElementSibling && el.parentNode && el.parentNode.parentNode && el.parentNode.nodeName != 'BODY')
        el.parentNode.parentNode.appendChild(el)
      else if (el.nextElementSibling && el.nextElementSibling.children.length)
        el.nextElementSibling.prepend(el)
      break
  }
}