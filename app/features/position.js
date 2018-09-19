import $ from 'blingblingjs'
import hotkeys from 'hotkeys-js'
import { getStyle, getSide, showHideSelected } from './utils.js'

const key_events = 'up,down,left,right'
  .split(',')
  .reduce((events, event) => 
    `${events},${event},alt+${event},shift+${event},shift+alt+${event}`
  , '')
  .substring(1)

const command_events = 'cmd+up,cmd+shift+up,cmd+down,cmd+shift+down'

export function Position() {
  this._els = []

  hotkeys(key_events, (e, handler) => {
    e.preventDefault()
    positionElement($('[data-selected=true]'), handler.key)
  })

  const onNodesSelected = els => {
    // teardown previous draggable nodes
    // init new draggable nodes
    this._els.forEach(el =>
      el.teardown())

    this._els = els.map(el =>
      draggable(el))
  }

  const disconnect = () => {
    this._els.off('mousedown', draggable)
    hotkeys.unbind(key_events)
    // hotkeys.unbind(command_events)
    hotkeys.unbind('up,down,left,right') // bug in lib?
  }

  return {
    onNodesSelected,
    disconnect,
  }
}

function draggable(el) {
  var isMouseDown = false
  var mouseX
  var mouseY
  var elementX
  var elementY

  const setup = () => {
    el.addEventListener('mousedown', onMouseDown, true)
    el.addEventListener('mouseup', onMouseUp, true)
    document.addEventListener('mousemove', onMouseMove, true)
  }

  const teardown = () => {
    el.removeEventListener('mousedown', onMouseDown, true)
    el.removeEventListener('mouseup', onMouseUp, true)
    document.removeEventListener('mousemove', onMouseMove, true)
  }

  function onMouseDown(e) {
    e.preventDefault()
    e.target.style.position = 'relative'
    e.target.style.transition = 'none'
    elementX = parseInt(getStyle(e.target, 'left'))
    elementY = parseInt(getStyle(e.target, 'top'))
    mouseX = e.clientX
    mouseY = e.clientY
    isMouseDown = true
  }

  function onMouseUp(e) {
    e.preventDefault()
    isMouseDown = false
    e.target.style.transition = null
    elementX = parseInt(el.style.left) || 0
    elementY = parseInt(el.style.top) || 0
  }

  function onMouseMove(e) {
    e.preventDefault()
    e.stopPropagation()

    if (!isMouseDown) return

    const deltaX = e.clientX - mouseX
    const deltaY = e.clientY - mouseY

    el.style.left = elementX + deltaX + 'px'
    el.style.top = elementY + deltaY + 'px'
  }

  setup()

  return {
    teardown
  }
}

export function positionElement(els, direction) {
  els
    .map(el => ensurePositionable(el))
    .map(el => showHideSelected(el))
    .map(el => ({
        el, 
        ...extractCurrentValueAndSide(el, direction),
        amount:   direction.split('+').includes('shift') ? 10 : 1,
        negative: determineNegativity(el, direction),
    }))
    .map(payload =>
      Object.assign(payload, {
        position: payload.negative
          ? payload.current + payload.amount 
          : payload.current - payload.amount
      }))
    .forEach(({el, style, position}) =>
      el instanceof SVGElement
        ? el.attr(style, position)
        : el.style[style] = position + 'px')
}

const extractCurrentValueAndSide = (el, direction) => {
  let style, current

  if (el instanceof SVGElement) {
    style = direction.includes('down') || direction.includes('up')
      ? 'cy'
      : 'cx'
            
    current = parseFloat(el.attr(style), 10)
  }
  else {
    style  = getSide(direction).toLowerCase()
    current   = getStyle(el, style)

    current === 'auto'
      ? current = 0
      : current = parseInt(current, 10)
  }

  return { style, current }
}

const determineNegativity = (el, direction) =>
  el instanceof SVGElement
    ? direction.includes('right') || direction.includes('down')
    : direction.split('+').includes('alt')

const ensurePositionable = el => {
  if (el instanceof HTMLElement) 
    el.style.position = 'relative'
  return el
}