import { $$, $ } from 'blingblingjs'
import hotkeys from 'hotkeys-js'
import { getStyle, getSide } from './utils.js'

const key_events = 'up,down,left,right'
  .split(',')
  .reduce((events, event) => 
    `${events},${event},alt+${event},shift+${event},shift+alt+${event}`
  , '')
  .substring(1)

export function Margin(selector) {
  hotkeys(key_events, (e, handler) => {
    e.preventDefault()
    pushElement($$(selector), handler.key)
  })

  return () => hotkeys.unbind(key_events)
}

export function pushElement(els, direction) {
  els
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
      el.style[style] = `${margin}px`)
}