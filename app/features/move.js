import $ from 'blingblingjs'
import hotkeys from 'hotkeys-js'

const key_events = 'up,down,left,right,backspace'
// todo: indicator for when node can descend
// todo: indicator where left and right will go
// todo: indicator when left or right hit dead ends
export function Moveable(selector) {
  hotkeys(key_events, (e, {key}) => {
    e.preventDefault()
    e.stopPropagation()
    
    $(selector).forEach(el => {
      moveElement(el, key)
      updateFeedback(el)
    })
  })

  return () => {
    hotkeys.unbind(key_events)
    hotkeys.unbind('up,down,left,right')
  }
}

export function moveElement(el, direction) {
  if (!el) return

  switch(direction) {
    case 'left':
      if (canMoveLeft(el))
        el.parentNode.insertBefore(el, el.previousElementSibling)
      else
        showEdge(el.parentNode)
      break

    case 'right':
      if (canMoveRight(el) && el.nextElementSibling.nextSibling)
        el.parentNode.insertBefore(el, el.nextElementSibling.nextSibling)
      else if (canMoveRight(el))
        el.parentNode.appendChild(el)
      else
        showEdge(el.parentNode)
      break

    case 'up':
      if (canMoveUp(el))
        el.parentNode.parentNode.prepend(el)
      break

    case 'down':
      // edge case behavior, user test
      if (!el.nextElementSibling && el.parentNode && el.parentNode.parentNode && el.parentNode.nodeName != 'BODY')
        el.parentNode.parentNode.insertBefore(el, el.parentNode.parentNode.children[[...el.parentElement.parentElement.children].indexOf(el.parentElement) + 1])
      if (canMoveDown(el))
        el.nextElementSibling.prepend(el)
      break
  }
}

export const canMoveLeft = el => el.previousElementSibling
export const canMoveRight = el => el.nextElementSibling
export const canMoveDown = el => 
  el.nextElementSibling && el.nextElementSibling.children.length
export const canMoveUp = el => 
  el.parentNode && el.parentNode.parentNode && el.parentNode.nodeName != 'BODY'

export function showEdge(el) {
  return el.animate([
    { outline: '1px solid transparent' },
    { outline: '1px solid hsla(330, 100%, 71%, 80%)' },
    { outline: '1px solid transparent' },
  ], 600)
}

export function updateFeedback(el) {
  let options = ''
  // get current elements offset/size
  if (canMoveLeft(el))  options += '⇠'
  if (canMoveRight(el)) options += '⇢'
  if (canMoveDown(el))  options += '⇣'
  if (canMoveUp(el))    options += '⇡'
  // create/move arrows in absolute/fixed to overlay element
  options && console.info('%c'+options, "font-size: 2rem;")
}