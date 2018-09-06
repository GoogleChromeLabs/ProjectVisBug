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

export function Position(selector) {
  hotkeys(key_events, (e, handler) => {
    e.preventDefault()
    positionElement($(selector), handler.key)
  })

  // hotkeys(command_events, (e, handler) => {
  //   e.preventDefault()
  //   pushAllElementSides($(selector), handler.key)
  // })

  return () => {
    hotkeys.unbind(key_events)
    // hotkeys.unbind(command_events)
    hotkeys.unbind('up,down,left,right') // bug in lib?
  }
}

export function positionElement(els, direction) {
  els
    .map(el => ensurePositionable(el))
    .map(el => showHideSelected(el))
    .map(el => { 
      const side = getSide(direction).toLowerCase()
      let cur = getStyle(el, side)

      cur === 'auto'
        ? cur = 0
        : cur = parseInt(cur, 10)

      return {
        el, 
        style:    side,
        current:  cur,
        amount:   direction.split('+').includes('shift') ? 10 : 1,
        negative: direction.split('+').includes('alt'),
      }
    })
    .map(payload =>
      Object.assign(payload, {
        position: payload.negative
          ? payload.current + payload.amount 
          : payload.current - payload.amount
      }))
    .forEach(({el, style, position}) =>
      el.style[style] = `${position}px`)
}

const ensurePositionable = el => {
  el.style.position = 'relative'
  return el
}