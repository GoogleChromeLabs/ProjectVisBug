import $ from 'blingblingjs'
import hotkeys from 'hotkeys-js'
import { metaKey, getStyle, getSide, showHideSelected } from '../utilities/'

const key_events = 'up,down,left,right'
  .split(',')
  .reduce((events, event) =>
    `${events},${event},alt+${event},shift+${event},shift+alt+${event}`
  , '')
  .substring(1)

const command_events = `${metaKey}+up,${metaKey}+shift+up,${metaKey}+down,${metaKey}+shift+down`

export function Position() {
  this._els = []

  hotkeys(key_events, (e, handler) => {
    if (e.cancelBubble) return

    e.preventDefault()
    positionElement($('[data-selected=true]'), handler.key)
  })

  const onNodesSelected = els => {
    this._els.forEach(el =>
      el.teardown())

    this._els = els.map(el =>
      draggable(el))
  }

  const disconnect = () => {
    this._els.forEach(el => el.teardown())
    hotkeys.unbind(key_events)
    hotkeys.unbind('up,down,left,right')
  }

  return {
    onNodesSelected,
    disconnect,
  }
}

export function draggable(el) {
  this.state = {
    mouse: {
      down: false,
      x: 0,
      y: 0,
    },
    element: {
      x: 0,
      y: 0,
    }
  }

  const setup = () => {
    el.style.transition   = 'none'
    el.style.cursor       = 'move'

    el.addEventListener('mousedown', onMouseDown, true)
    el.addEventListener('mouseup', onMouseUp, true)
    document.addEventListener('mousemove', onMouseMove, true)
  }

  const teardown = () => {
    el.style.transition   = null
    el.style.cursor       = null

    el.removeEventListener('mousedown', onMouseDown, true)
    el.removeEventListener('mouseup', onMouseUp, true)
    document.removeEventListener('mousemove', onMouseMove, true)
  }

  const onMouseDown = e => {
    e.preventDefault()

    const el = e.target

    el.style.position = 'relative'
    el.style.willChange = 'top,left'

    if (el instanceof SVGElement) {
      const translate = el.getAttribute('transform')

      const [ x, y ] = translate
        ? extractSVGTranslate(translate)
        : [0,0]

      this.state.element.x  = x
      this.state.element.y  = y
    }
    else {
      this.state.element.x  = parseInt(getStyle(el, 'left'))
      this.state.element.y  = parseInt(getStyle(el, 'top'))
    }

    this.state.mouse.x      = e.clientX
    this.state.mouse.y      = e.clientY
    this.state.mouse.down   = true
  }

  const onMouseUp = e => {
    e.preventDefault()

    this.state.mouse.down = false
    el.style.willChange = null

    if (el instanceof SVGElement) {
      const translate = el.getAttribute('transform')

      const [ x, y ] = translate
        ? extractSVGTranslate(translate)
        : [0,0]

      this.state.element.x    = x
      this.state.element.y    = y
    }
    else {
      this.state.element.x    = parseInt(el.style.left) || 0
      this.state.element.y    = parseInt(el.style.top) || 0
    }
  }

  const onMouseMove = e => {
    e.preventDefault()
    e.stopPropagation()

    if (!this.state.mouse.down) return

    if (el instanceof SVGElement) {
      el.setAttribute('transform', `translate(
        ${this.state.element.x + e.clientX - this.state.mouse.x},
        ${this.state.element.y + e.clientY - this.state.mouse.y}
      )`)
    }
    else {
      el.style.left = this.state.element.x + e.clientX - this.state.mouse.x + 'px'
      el.style.top  = this.state.element.y + e.clientY - this.state.mouse.y + 'px'
    }
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
        ? setTranslateOnSVG(el, direction, position)
        : el.style[style] = position + 'px')
}

const extractCurrentValueAndSide = (el, direction) => {
  let style, current

  if (el instanceof SVGElement) {
    const translate = el.attr('transform')

    const [ x, y ] = translate
      ? extractSVGTranslate(translate)
      : [0,0]

    style   = 'transform'
    current = direction.includes('down') || direction.includes('up')
      ? y
      : x
  }
  else {
    const side = getSide(direction).toLowerCase()
    style = (side === 'top' || side === 'bottom') ? 'top' : 'left'
    current = getStyle(el, style)

    current === 'auto'
      ? current = 0
      : current = parseInt(current, 10)
  }

  return { style, current }
}

const extractSVGTranslate = translate =>
  translate.substring(
    translate.indexOf('(') + 1,
    translate.indexOf(')')
  ).split(',')
  .map(val => parseFloat(val))

const setTranslateOnSVG = (el, direction, position) => {
  const transform = el.attr('transform')
  const [ x, y ] = transform
    ? extractSVGTranslate(transform)
    : [0,0]

  const pos = direction.includes('down') || direction.includes('up')
    ? `${x},${position}`
    : `${position},${y}`

  el.attr('transform', `translate(${pos})`)
}

const determineNegativity = (el, direction) =>
  direction.includes('right') || direction.includes('down')

const ensurePositionable = el => {
  if (el instanceof HTMLElement)
    el.style.position = 'relative'
  return el
}
