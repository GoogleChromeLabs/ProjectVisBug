import $ from 'blingblingjs'
import hotkeys from 'hotkeys-js'
import { TinyColor } from '@ctrl/tinycolor'

import { getStyle, showHideSelected } from './utils.js'

const key_events = 'up,down,left,right'
  .split(',')
  .reduce((events, event) => 
    `${events},${event},shift+${event}`
  , '')
  .substring(1)

const command_events = 'cmd+up,cmd+shift+up,cmd+down,cmd+shift+down,cmd+left,cmd+shift+left,cmd+right,cmd+shift+right'

export function HueShift(selector) {
  hotkeys(key_events, (e, handler) => {
    e.preventDefault()

    let selectedNodes = $(selector)
      , keys = handler.key.split('+')

    keys.includes('left') || keys.includes('right')
      ? changeHue(selectedNodes, keys, 's')
      : changeHue(selectedNodes, keys, 'l')
  })

  hotkeys(command_events, (e, handler) => {
    e.preventDefault()
    let keys = handler.key.split('+')
    keys.includes('left') || keys.includes('right')
      ? changeHue($(selector), keys, 'a')
      : changeHue($(selector), keys, 'h')
  })

  return () => {
    hotkeys.unbind(key_events)
    hotkeys.unbind(command_events)
    hotkeys.unbind('up,down,left,right')
  }
}

// todo: more hotkeys
// b: black
// w: white
export function changeHue(els, direction, prop) {
  els
    .map(el => showHideSelected(el))
    .map(el => {
      const FG = new TinyColor(getStyle(el, 'color'))
      const BG = new TinyColor(getStyle(el, 'backgroundColor'))
      
      return BG.originalInput != 'rgba(0, 0, 0, 0)'             // if bg is set to a value
        ? { el, current: BG.toHsl(), style: 'backgroundColor' } // use bg
        : { el, current: FG.toHsl(), style: 'color' }           // else use fg
    })
    .map(payload =>
      Object.assign(payload, {
        amount:   direction.includes('shift') ? 10 : 1,
        negative: direction.includes('down') || direction.includes('left'),
      }))
    .map(payload => {
      if (prop === 's' || prop === 'l' || prop === 'a')
        payload.amount = payload.amount * 0.01

      payload.current[prop] = payload.negative
        ? payload.current[prop] - payload.amount 
        : payload.current[prop] + payload.amount

      if (prop === 's' || prop === 'l' || prop === 'a') {
        if (payload.current[prop] > 1) payload.current[prop] = 1
        if (payload.current[prop] < 0) payload.current[prop] = 0
      }

      return payload
    })
    .forEach(({el, style, current}) =>
      el.style[style] = new TinyColor(current).setAlpha(current.a).toHslString())
}
