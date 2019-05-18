import $ from 'blingblingjs'
import hotkeys from 'hotkeys-js'
import { getNodeIndex, showEdge, swapElements } from '../utilities/'
import { toggleWatching } from './imageswap'

const key_events = 'up,down,left,right'
const state = {
  drag: {
    src:      null,
    parent:   null,
    siblings: [],
  },
  hover: {
    elements: [],
    observers: [],
  },
}
// todo: indicator for when node can descend
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
    visbug.removeSelectedCallback(dragNDrop)
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
  clearListeners()

  if (selection.length !== 1 || selection[0] instanceof SVGElement) 
    return 

   const [src] = selection
   const {parentNode} = src

  state.drag.siblings = [...parentNode.children]
  state.drag.parent   = parentNode

  moveWatch(state.drag.parent)
}

const moveWatch = node => {
  const $node = $(node)

  $node.on('mouseleave', dragDrop)
  $node.on('dragstart', dragStart)
  $node.on('drop', dragDrop)

  state.drag.siblings.forEach(sibling =>
    $(sibling).on('dragover', dragOver))

  state.drag.siblings.forEach(sibling => {
    sibling.setAttribute('draggable', true)
    state.hover.elements.push(createDropzoneUI(sibling))
    $(sibling).on('dragover', dragOver)
  })
}

const moveUnwatch = node => {
  const $node = $(node)

  $node.off('mouseleave', dragDrop)
  $node.off('dragstart', dragStart)
  $node.off('drop', dragDrop)

  state.drag.siblings.forEach(sibling => {
    sibling.removeAttribute('draggable')
    state.hover.elements.push(createDropzoneUI(sibling))
    $(sibling).off('dragover', dragOver)
  })
}

const dragStart = ({target}) => {
  state.drag.src = target
  ghostNode(target)
  target.setAttribute('visbug-drag-src', true)
}

const dragOver = e => {
  if (e.target.hasAttribute('visbug-drag-src')) return
  
  swapElements(state.drag.src, e.currentTarget)
}

const dragDrop = e => {
  if (!state.drag.src) return

  state.drag.src.removeAttribute('visbug-drag-src')
  ghostBuster(state.drag.src)
}

const ghostNode = ({style}) => {
  style.transition  += 'opacity .25s ease-out'
  style.opacity     = 0.01
}

const ghostBuster = ({style}) => {
  style.transition  = null
  style.opacity     = null
}

const createDropzoneUI = el => {
  const hover = document.createElement('visbug-corners')

  hover.position = {el}
  document.body.appendChild(hover)

  const observer = new MutationObserver(list =>
    hover.position = {el})

  observer.observe(el.parentNode, { 
    childList: true, 
    subtree: true, 
  })

  state.hover.observers.push(observer)

  return hover
}

export function clearListeners() {
  moveUnwatch(state.drag.parent)

  state.hover.observers.forEach(observer => 
    observer.disconnect())

  state.hover.elements.forEach(hover => 
    hover.remove())
}

const updateFeedback = el => {
  let options = ''
  // get current elements offset/size
  if (canMoveLeft(el))  options += '⇠'
  if (canMoveRight(el)) options += '⇢'
  if (canMoveDown(el))  options += '⇣'
  if (canMoveUp(el))    options += '⇡'
  // create/move arrows in absolute/fixed to overlay element
  options && console.info('%c'+options, "font-size: 2rem;")
}
