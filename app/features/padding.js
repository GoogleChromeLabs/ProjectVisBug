import { $$, $ } from 'blingblingjs'
import hotkeys from 'hotkeys-js'
import { getStyle, getSide } from './utils.js'
// todo: cmd does all sides
// todo: show padding color
const key_events = 'up,down,left,right'
  .split(',')
  .reduce((events, event) => 
    `${events},${event},alt+${event},shift+${event},shift+alt+${event}`
  , '')
  .substring(1)

export function Padding(selector) {
  hotkeys(key_events, (e, handler) => {
    e.preventDefault()
    padElement($$(selector), handler.key)
  })

  return () => hotkeys.unbind(key_events)
}

export function padElement(els, direction) {
  els
    .map(el => ({ 
      el, 
      style:    'padding' + getSide(direction),
      current:  parseInt(getStyle(el, 'padding' + getSide(direction)), 10),
      amount:   direction.split('+').includes('shift') ? 10 : 1,
      negative: direction.split('+').includes('alt'),
    }))
    .map(payload =>
      Object.assign(payload, {
        padding: payload.negative
          ? payload.current - payload.amount 
          : payload.current + payload.amount
      }))
    .forEach(({el, style, padding}) =>
      el.style[style] = `${padding}px`)
}
