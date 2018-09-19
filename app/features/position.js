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
    if (this._els.length) 
      this._els.off('mousedown', draggable)

    this._els = $(...els).on('mousedown', draggable)
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

function draggable({target}) {
  var isMouseDown = false
  var mouseX
  var mouseY
  var elementX = 0
  var elementY = 0

  target.addEventListener('mousedown', onMouseDown)
  target.addEventListener('mouseup', onMouseUp)
  document.addEventListener('mousemove', onMouseMove)

  function onMouseDown(e) {
    e.preventDefault()
    mouseX = e.clientX
    mouseY = e.clientY
    isMouseDown = true
  }

  function onMouseUp(e) {
    isMouseDown = false
    elementX = parseInt(target.style.left) || 0
    elementY = parseInt(target.style.top) || 0
  }

  function onMouseMove(e) {
    e.preventDefault()
    if (!isMouseDown) return

    const deltaX = e.clientX - mouseX
    const deltaY = e.clientY - mouseY

    target.style.left = elementX + deltaX + 'px'
    target.style.top = elementY + deltaY + 'px'
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