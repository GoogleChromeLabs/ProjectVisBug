import $ from 'blingblingjs'
import hotkeys from 'hotkeys-js'
import { metaKey, getStyle, getSide, showHideSelected } from '../utilities/'
import Moveable from 'moveable'

const key_events = 'up,down,left,right'
  .split(',')
  .reduce((events, event) =>
    `${events},${event},alt+${event},shift+${event},shift+alt+${event}`
  , '')
  .substring(1)

const command_events = `${metaKey}+up,${metaKey}+shift+up,${metaKey}+down,${metaKey}+shift+down`

export function Position() {
  const state = {
    elements: []
  }

  hotkeys(key_events, (e, handler) => {
    if (e.cancelBubble) return

    e.preventDefault()
    positionElement(state.elements, handler.key)
  })

  const onNodesSelected = els => {
    state.elements.forEach(el =>
      el.teardown())

    state.elements = els.map(el => {
      draggable({el})
      rotatable(el)
      return el
    })
  }

  const disconnect = () => {
    state.elements.forEach(el => el.teardown())
    hotkeys.unbind(key_events)
    hotkeys.unbind('up,down,left,right')
  }

  return {
    onNodesSelected,
    disconnect,
  }
}

export function draggable({el, surface = el, cursor = 'move', clickEvent}) {
   const state = {
    target: el,
    surface,
    mouse: {
      down: false,
      x: 0,
      y: 0,
    },
    element: {
      x: 0,
      y: 0,
    },
    travelDistance: 0
  }

  const setup = () => {
    el.style.transition   = 'none'
    surface.style.cursor  = cursor

    surface.addEventListener('mousedown', onMouseDown, true)
    surface.addEventListener('mouseup', onMouseUp, true)
    document.addEventListener('mousemove', onMouseMove, true)
  }

  const teardown = () => {
    el.style.transition   = null
    surface.style.cursor  = null

    surface.removeEventListener('mousedown', onMouseDown, true)
    surface.removeEventListener('mouseup', onMouseUp, true)
    document.removeEventListener('mousemove', onMouseMove, true)
  }

  const onMouseDown = e => {
    if(e.target !== state.surface) return
    e.preventDefault()

    if(getComputedStyle(el).position == 'static')
      el.style.position = 'relative'
    el.style.willChange = 'top,left'

    if (el instanceof SVGElement) {
      const translate = el.getAttribute('transform')

      const [ x, y ] = translate
        ? extractSVGTranslate(translate)
        : [0,0]

      state.element.x  = x
      state.element.y  = y
    }
    else {
      state.element.x  = parseInt(getStyle(el, 'left'))
      state.element.y  = parseInt(getStyle(el, 'top'))
    }

    state.mouse.x        = e.clientX
    state.mouse.y        = e.clientY
    state.mouse.down     = true
    state.travelDistance = 0
  }

  const onMouseUp = e => {
    if(e.target !== state.surface) return

    e.preventDefault()
    e.stopPropagation()

    state.mouse.down = false
    el.style.willChange = null

    if (el instanceof SVGElement) {
      const translate = el.getAttribute('transform')

      const [ x, y ] = translate
        ? extractSVGTranslate(translate)
        : [0,0]

      state.element.x    = x
      state.element.y    = y
    }
    else {
      state.element.x    = parseInt(el.style.left) || 0
      state.element.y    = parseInt(el.style.top) || 0
    }

    const treatAsClick = !state.travelDistance || state.travelDistance < 5
    if (clickEvent && treatAsClick) clickEvent(e);
    state.travelDistance = 0 // reset after
  }

  const onMouseMove = e => {
    if (!state.mouse.down) return

    e.preventDefault()
    e.stopPropagation()


    if (el instanceof SVGElement) {
      el.setAttribute('transform', `translate(
        ${state.element.x + e.clientX - state.mouse.x},
        ${state.element.y + e.clientY - state.mouse.y}
      )`)
    }
    else {
      el.style.left = state.element.x + e.clientX - state.mouse.x + 'px'
      el.style.top  = state.element.y + e.clientY - state.mouse.y + 'px'
    }

    state.travelDistance += 1
  }

  setup()
  el.teardown = teardown

  return el
}

export function rotatable(el) {
  const mv = new Moveable(document.body, {
    target: el,
    rotatable: true
  })

  const originalElPosition = el.getBoundingClientRect();
  const {x:originalX, y:originalY, width:originalW} = originalElPosition
  
  const deleteButton = document.createElement('visbug-moveable-delete-button')
  deleteButton.innerText = '✕'
  deleteButton.style.position = 'absolute'
  deleteButton.style.left = 0
  deleteButton.style.top = 0
  deleteButton.style.transform = `translate(${originalX + originalW + 10}px,${originalY}px)`
  deleteButton.style.zIndex = 1
  deleteButton.style.background = 'var(--moveable-color, #4af)'
  deleteButton.style.color = '#fff'
  deleteButton.style.zIndex = 1
  deleteButton.style.width = '24px'
  deleteButton.style.height = '24px'
  deleteButton.style.borderRadius = '4px'
  deleteButton.style.opacity = 0.9
  deleteButton.style.display = 'flex'
  deleteButton.style.justifyContent = 'center'
  deleteButton.style.alignItems = 'center'
  deleteButton.style.cursor = 'pointer'
  function handleDeleteButton() {
    deleteButton.removeEventListener('click', handleDeleteButton)
    deleteButton.remove()
    mv.destroy()
    el.remove()
  }
  deleteButton.addEventListener('click', handleDeleteButton)
  document.body.appendChild(deleteButton)

  mv.on('rotate', e => {
    e.target.style.transform = e.drag.transform
    const currentElPosition = e.target.getBoundingClientRect()
    const {x,y,width,height} = currentElPosition
    deleteButton.style.transformOrigin = `${x+width/2}px ${y+height/2}px`
    deleteButton.style.transform = e.drag.transform + ` translate(${originalX + originalW + 10}px,${originalY}px) `
  })
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
