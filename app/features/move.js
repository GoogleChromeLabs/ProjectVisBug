import $ from 'blingblingjs'
import hotkeys from 'hotkeys-js'
import { getNodeIndex, showEdge, swapElements, notList } from '../utilities/'
import { toggleWatching } from './imageswap'

const key_events = 'up,down,left,right'
const state = {
  drag: {
    src:        null,
    parent:     null,
    parent_ui:  [],
    siblings:   new Map(),
    swapping:   new Map(),
  },
  hover: {
    dropzones: [],
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
  if (!selection.length)
    return

  clearListeners()

  const [src]         = selection
  const {parentNode}  = src

  const validMoveableChildren = [...parentNode.querySelectorAll(':scope > *' + notList)]

  const tooManySelected       = selection.length !== 1
  const hasNoSiblingsToDrag   = validMoveableChildren.length <= 1
  const isAnSVG               = src instanceof SVGElement

  if (tooManySelected || hasNoSiblingsToDrag || isAnSVG) 
    return 

  validMoveableChildren.forEach(sibling =>
    state.drag.siblings.set(sibling, createGripUI(sibling)))

  state.drag.parent     = parentNode
  state.drag.parent_ui  = createParentUI(parentNode)

  moveWatch(state.drag.parent)
}

const moveWatch = node => {
  const $node = $(node)

  $node.on('mouseleave', dragDrop)
  $node.on('dragstart', dragStart)
  $node.on('drop', dragDrop)

  state.drag.siblings.forEach((grip, sibling) => {
    sibling.setAttribute('draggable', true)
    $(sibling).on('dragover', dragOver)
    $(sibling).on('mouseenter', siblingHoverIn)
    $(sibling).on('mouseleave', siblingHoverOut)
  })
}

const moveUnwatch = node => {
  const $node = $(node)

  $node.off('mouseleave', dragDrop)
  $node.off('dragstart', dragStart)
  $node.off('drop', dragDrop)

  state.drag.siblings.forEach((grip, sibling) => {
    sibling.removeAttribute('draggable')
    $(sibling).off('dragover', dragOver)
    $(sibling).off('mouseenter', siblingHoverIn)
    $(sibling).off('mouseleave', siblingHoverOut)
  })
}

const dragStart = ({target}) => {
  if (!state.drag.siblings.has(target))
    return

  state.drag.src = target
  state.hover.dropzones.push(createDropzoneUI(target))
  state.drag.siblings.get(target).style.opacity = 0.01

  target.setAttribute('visbug-drag-src', true)
  ghostNode(target)

  $('visbug-hover').forEach(el =>
    !el.hasAttribute('visbug-drag-container') && el.remove())
}

const dragOver = e => {
  if (
    !state.drag.src || 
    state.drag.swapping.get(e.target) || 
    e.target.hasAttribute('visbug-drag-src') || 
    !state.drag.siblings.has(e.currentTarget) ||
    e.currentTarget !== e.target
  ) return

  state.drag.swapping.set(e.target, true)
  swapElements(state.drag.src, e.target)

  setTimeout(() => 
    state.drag.swapping.delete(e.target)
  , 250)
}

const dragDrop = e => {
  if (!state.drag.src) return

  state.drag.src.removeAttribute('visbug-drag-src')
  ghostBuster(state.drag.src)

  if (state.drag.siblings.has(state.drag.src))
    state.drag.siblings.get(state.drag.src).style.opacity = null

  state.hover.dropzones.forEach(zone =>
    zone.remove())

  state.drag.src = null
}

const siblingHoverIn = ({target}) => {
  if (!state.drag.siblings.has(target))
    return

  state.drag.siblings.get(target)
    .toggleHovering({hovering:true})
}

const siblingHoverOut = ({target}) => {
  if (!state.drag.siblings.has(target))
    return

  state.drag.siblings.get(target)
    .toggleHovering({hovering:false})
}

const ghostNode = ({style}) => {
  style.transition  = 'opacity .25s ease-out'
  style.opacity     = 0.01
}

const ghostBuster = ({style}) => {
  style.transition  = null
  style.opacity     = null
}

const createDropzoneUI = el => {
  const zone = document.createElement('visbug-corners')

  zone.position = {el}
  document.body.appendChild(zone)

  const observer = new MutationObserver(list =>
    zone.position = {el})

  observer.observe(el.parentNode, { 
    childList: true, 
    subtree: true, 
  })

  state.hover.observers.push(observer)

  return zone
}

const createGripUI = el => {
  const grip = document.createElement('visbug-grip')

  grip.position = {el}
  document.body.appendChild(grip)

  const observer = new MutationObserver(list =>
    grip.position = {el})

  observer.observe(el.parentNode, { 
    childList: true, 
    subtree: true, 
  })

  state.hover.observers.push(observer)

  return grip
}

const createParentUI = parent => {
  const hover = document.createElement('visbug-hover')
  const label = document.createElement('visbug-label')

  hover.position = {el:parent}
  hover.setAttribute('visbug-drag-container', true)

  label.text = 'Drag Bounds'
  label.position = {boundingRect: parent.getBoundingClientRect()}
  label.style.setProperty('--label-bg', 'var(--theme-purple)')

  document.body.appendChild(hover)
  document.body.appendChild(label)

  const observer = new MutationObserver(list => {
    hover.position = {el:parent}
    label.position = {boundingRect: parent.getBoundingClientRect()}
  })

  observer.observe(parent, { 
    childList: true, 
    subtree: true, 
  })

  state.hover.observers.push(observer)

  return [hover,label]
}

export function clearListeners() {
  moveUnwatch(state.drag.parent)

  state.hover.observers.forEach(observer => 
    observer.disconnect())

  state.hover.dropzones.forEach(zone => 
    zone.remove())

  state.drag.siblings.forEach((grip, sibling) => 
    grip.remove())

  state.drag.parent_ui.forEach(ui => 
    ui.remove())

  state.hover.observers = []
  state.hover.dropzones = []
  state.drag.parent_ui  = []
  state.drag.siblings.clear()
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
