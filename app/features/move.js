import $ from 'blingblingjs'
import hotkeys from 'hotkeys-js'
import { getNodeIndex, showEdge, swapElements } from '../utilities/'
import { toggleWatching } from './imageswap'

const key_events = 'up,down,left,right'
const state = {
  drag: {
    src:      [],
    target:   null,
    siblings: [],
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
  toggleWatching({watch: false})

  return () => {
    toggleWatching({watch: true})
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

  clearListeners()

  const [src] = selection
  state.drag.siblings = src.parentNode.children.length
    ? [...src.parentNode.children]
        .filter(child => !child.hasAttribute('data-selected'))
    : []

  dragWatch($(src))

  state.drag.siblings.forEach(sibling => 
    dropWatch($(sibling)))
}

function dragWatch($el) {
  state.drag.src = $el
  $el.attr('draggable', true)
}

function dragUnwatch($el) {
  state.drag.src = null
  $el.attr('draggable', null)
}

function dropWatch($el) {
  $el.on('dragover', dragOver)
  $el.on('dragleave', dragExit)
  $el.on('drop', dragDrop)
  $el.attr('data-potention-dropzone', true)
}

function dropUnwatch($el) {
  $el.off('dragover', dragOver)
  $el.off('dragleave', dragExit)
  $el.off('drop', dragDrop)
  $el.attr('data-potention-dropzone', null)
}

function dragOver({currentTarget}) {
  currentTarget.setAttribute('data-dropzone', true)

  const [src] = state.drag.src
  if (src)
    swapElements(src, currentTarget)
}

function dragExit({currentTarget}) {
  currentTarget.removeAttribute('data-dropzone')
}

function dragDrop({currentTarget}) {
  currentTarget.removeAttribute('data-dropzone')

  const [src] = state.drag.src
  if (src)
    swapElements(src, currentTarget)
}

export function clearListeners() {
  state.drag.src.forEach(src =>
    dragUnwatch($(src)))

  state.drag.siblings.forEach(sibling => 
    dropUnwatch($(sibling)))
}

function updateFeedback(el) {
  let options = ''
  // get current elements offset/size
  if (canMoveLeft(el))  options += '⇠'
  if (canMoveRight(el)) options += '⇢'
  if (canMoveDown(el))  options += '⇣'
  if (canMoveUp(el))    options += '⇡'
  // create/move arrows in absolute/fixed to overlay element
  options && console.info('%c'+options, "font-size: 2rem;")
}