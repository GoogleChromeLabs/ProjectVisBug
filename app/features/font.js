import { $$, $ } from 'blingblingjs'
import hotkeys from 'hotkeys-js'
import { getStyle } from './utils.js'

const key_events = 'up,down'
  .split(',')
  .reduce((events, event) => 
    `${events},${event},shift+${event}`
  , '')
  .substring(1)

export function Font(selector) {
  hotkeys(key_events, (e, handler) => {
    e.preventDefault()
    
    handler.key.split('+').includes('shift')
      ? changeLeading($$(selector), handler.key)
      : changeFontSize($$(selector), handler.key)
  })

  return () => hotkeys.unbind(key_events)
}

export function changeLeading(els, direction) {
  els
    .map(el => ({ 
      el, 
      style:    'lineHeight',
      current:  parseInt(getStyle(el, 'lineHeight')),
      amount:   1,
      negative: direction.split('+').includes('down'),
    }))
    .map(payload =>
      Object.assign(payload, {
        current: payload.current == 'normal' || isNaN(payload.current)
          ? 1.14 * parseInt(getStyle(payload.el, 'fontSize')) // document this choice
          : payload.current
      }))
    .map(payload =>
      Object.assign(payload, {
        value: payload.negative
          ? payload.current - payload.amount 
          : payload.current + payload.amount
      }))
    .forEach(({el, style, value}) =>
      el.style[style] = `${value}px`)
}

export function changeFontSize(els, direction) {
  els
    .map(el => ({ 
      el, 
      style:    'fontSize',
      current:  parseInt(getStyle(el, 'fontSize')),
      amount:   direction.split('+').includes('shift') ? 10 : 1,
      negative: direction.split('+').includes('down'),
    }))
    .map(payload =>
      Object.assign(payload, {
        font_size: payload.negative
          ? payload.current - payload.amount 
          : payload.current + payload.amount
      }))
    .forEach(({el, style, font_size}) =>
      el.style[style] = `${font_size <= 6 ? 6 : font_size}px`)
}
