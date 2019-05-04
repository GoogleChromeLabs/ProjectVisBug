import $ from 'blingblingjs'
import hotkeys from 'hotkeys-js'
import { getNodeIndex, showEdge } from '../utilities/'

const key_events = 'up,down,left,right'
const state = {
  drag: {
    src: null,
    target: null,
  }
}
// todo: indicator for when node can descend
// todo: indicator where left and right will go
// todo: have it work with shadowDOM
export function Moveable(visbug) {
  hotkeys(key_events, (e, {key}) => {
    if (e.cancelBubble) return
      
    e.preventDefault()
    e.stopPropagation()
    
    visbug.selection().forEach(el => {
      moveElement(el, key)
      updateFeedback(el)
    })
  })

  visbug.onSelectedUpdate(dragNDrop)

  return () => {
    hotkeys.unbind(key_events)
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
        popOut({el})
      break

    case 'down':
      if (canMoveUnder(el))
        popOut({el, under: true})
      else if (canMoveDown(el))
        el.nextElementSibling.prepend(el)
      break
  }
}

export const canMoveLeft    = el => el.previousElementSibling
export const canMoveRight   = el => el.nextElementSibling
export const canMoveDown    = el => el.nextElementSibling && el.nextElementSibling.children.length
export const canMoveUnder   = el => !el.nextElementSibling && el.parentNode && el.parentNode.parentNode
export const canMoveUp      = el => el.parentNode && el.parentNode.parentNode

export const popOut = ({el, under = false}) =>
  el.parentNode.parentNode.insertBefore(el, 
    el.parentNode.parentNode.children[
      under
        ? getNodeIndex(el) + 1
        : getNodeIndex(el)]) 

export function dragNDrop(selection) {
  if (selection.length !== 1) return

  const [rootnode] = selection
  const siblings = rootnode.parentNode.children.length
    ? [...rootnode.parentNode.children]
        .filter(child => !child.hasAttribute('data-selected'))
    : []

  dragWatch($(rootnode))

  siblings.forEach(sibling => 
    dropWatch($(sibling)))
}

export function dragWatch($el) {
  state.drag.src = $el

  $el.attr('draggable', true)
  // $el.on('dragend', dragUnwatch)
}

export function dropWatch($el) {
  $el.on('dragover', dragOver)
  // $el.on('dragenter', dragEnter)
  $el.on('dragleave', dragExit)
  $el.on('drop', dragDrop)
}

export function dragUnwatch(e) {
  if (!state.drag.src) return

  const $el = state.drag.src

  $el.off('dragover', dragOver)
  // $el.off('dragenter', dragEnter)
  $el.off('dragleave', dragExit)
  $el.off('drop', dragDrop)
  $el.off('dragend', dragUnwatch)

  $el.attr('draggable', null)
  state.drag.src = null
}

export function dragOver(e) {
  e.currentTarget.setAttribute('data-pseudo-select', true)
}

// export function dragEnter(e) {
//   e.currentTarget.setAttribute('data-pseudo-select', true)
// }

export function dragExit(e) {
  e.currentTarget.removeAttribute('data-pseudo-select')
}

export function dragDrop({currentTarget}) {
  const [src] = state.drag.src
  if (!src) return

  swapElements(src, currentTarget)
  currentTarget.removeAttribute('data-pseudo-select')
}

export function swapElements(src, target) {
  var temp = document.createElement("div")

  src.parentNode.insertBefore(temp, src)
  target.parentNode.insertBefore(src, target)
  temp.parentNode.insertBefore(target, temp)

  temp.parentNode.removeChild(temp)
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