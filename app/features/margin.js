import { $$, $ } from 'blingblingjs'
import hotkeys from 'hotkeys-js'
import { getStyle, getSide, showHideSelected } from './utils.js'

// todo: show margin color
const key_events = 'up,down,left,right'
  .split(',')
  .reduce((events, event) => 
    `${events},${event},alt+${event},shift+${event},shift+alt+${event}`
  , '')
  .substring(1)

const command_events = 'cmd+up,cmd+shift+up,cmd+down,cmd+shift+down'

export function Margin(selector) {
  hotkeys(key_events, (e, handler) => {
    e.preventDefault()
    pushElement($$(selector), handler.key)
  })

  hotkeys(command_events, (e, handler) => {
    e.preventDefault()
    pushAllElementSides($$(selector), handler.key)
  })

  return () => {
    hotkeys.unbind(key_events)
    hotkeys.unbind(command_events)
    hotkeys.unbind('up,down,left,right') // bug in lib?
  }
}

export function pushElement(els, direction) {
  els
    .map(el => showHideSelected(el))
    .map(el => ({ 
      el, 
      style:    'margin' + getSide(direction),
      current:  parseInt(getStyle(el, 'margin' + getSide(direction)), 10),
      amount:   direction.split('+').includes('shift') ? 10 : 1,
      negative: direction.split('+').includes('alt'),
    }))
    .map(payload =>
      Object.assign(payload, {
        margin: payload.negative
          ? payload.current - payload.amount 
          : payload.current + payload.amount
      }))
    .forEach(({el, style, margin}) =>
      el.style[style] = `${margin < 0 ? 0 : margin}px`)
}

export function pushAllElementSides(els, keycommand) {
  const combo = keycommand.split('+')
  let spoof = ''

  if (combo.includes('shift'))  spoof = 'shift+' + spoof
  if (combo.includes('down'))   spoof = 'alt+' + spoof

  'up,down,left,right'.split(',')
    .forEach(side => pushElement(els, spoof + side))
}