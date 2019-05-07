import $ from 'blingblingjs'
import hotkeys from 'hotkeys-js'
import { getNodeIndex, showEdge, swapElements } from '../utilities/'
import { toggleWatching } from './imageswap'

const key_events = 'up,down,left,right'
const state = {
  drag: {
    src:      [],
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
    clearListeners()
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

  srcWatch(src)

  state.drag.siblings
    .forEach(siblingWatch)
}

function srcWatch(src) {
  const $src = $(src)
  state.drag.src = src
  $(src.parentNode).on('dragleave', dragExit)
  $src.on('drop', dragDrop)
  $src.attr('draggable', true)
}

function srcUnwatch(src) {
  const $src = $(src)
  state.drag.src = null
  $src.attr('draggable', null)
  $(src.parentNode).off('dragleave', dragExit)
  $src.off('drop', dragDrop)
}

function siblingWatch(sibling) {
  const $sibling = $(sibling)
  $sibling.on('dragover', dragOver)
  $sibling.attr('data-potential-dropzone', true)
}

function siblingUnwatch(sibling) {
  const $sibling = $(sibling)
  $sibling.off('dragover', dragOver)
  $sibling.attr('data-potential-dropzone', null)
}

function dragOver({currentTarget}) {
  currentTarget.setAttribute('data-dropzone', true)

  if (state.drag.src)
    swapElements(state.drag.src, currentTarget)
}

function dragExit(e) {
  if (e.target === e.currentTarget)
    console.log('exit')
}

function dragDrop(e) {
  console.log('drop')
}

export function clearListeners() {
  state.drag.src && srcUnwatch(state.drag.src)
  state.drag.siblings
    .forEach(siblingUnwatch)
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
