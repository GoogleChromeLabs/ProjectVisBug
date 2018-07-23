import $ from 'blingblingjs'
import hotkeys from 'hotkeys-js'
import { getStyle, showHideSelected } from './utils.js'

const key_events = 'up,down,left,right'
  .split(',')
  .reduce((events, event) => 
    `${events},${event},shift+${event}`
  , '')
  .substring(1)

const command_events = 'cmd+up,cmd+down'

export function BoxShadow(selector) {
  hotkeys(key_events, (e, handler) => {
    e.preventDefault()

    let selectedNodes = $(selector)
      , keys = handler.key.split('+')

    if (keys.includes('left') || keys.includes('right'))
      keys.includes('shift')
        ? changeBoxShadow(selectedNodes, keys, 'size')
        : changeBoxShadow(selectedNodes, keys, 'x')
    else
      keys.includes('shift')
        ? changeBoxShadow(selectedNodes, keys, 'blur')
        : changeBoxShadow(selectedNodes, keys, 'y')
  })

  hotkeys(command_events, (e, handler) => {
    e.preventDefault()
    let keys = handler.key.split('+')
    changeBoxShadow($(selector), keys, 'inset')
  })

  return () => {
    hotkeys.unbind(key_events)
    hotkeys.unbind(command_events)
    hotkeys.unbind('up,down,left,right')
  }
}

const ensureHasShadow = el => {
  if (el.style.boxShadow == '' || el.style.boxShadow == 'none')
    el.style.boxShadow = 'hsla(0,0%,0%,50%) 0 0 0 0'
  return el
}

// todo: work around this propMap with a better split
const propMap = {
  'x':      4,
  'y':      5,
  'blur':   6,
  'size':   7,
  'inset':  8,
}

const parseCurrentShadow = el => getStyle(el, 'boxShadow').split(' ')

export function changeBoxShadow(els, direction, prop) {
  els
    .map(ensureHasShadow)
    .map(el => showHideSelected(el, 1500))
    .map(el => ({ 
      el, 
      style:     'boxShadow',
      current:   parseCurrentShadow(el), // ["rgb(255,", "0,", "0)", "0px", "0px", "1px", "0px"]
      propIndex: parseCurrentShadow(el)[0].includes('rgba') ? propMap[prop] : propMap[prop] - 1
    }))
    .map(payload => {
      let updated = [...payload.current]
      let cur     = parseInt(payload.current[payload.propIndex])

      if (prop == 'blur') {
        updated[payload.propIndex] = direction.includes('down')
          ? `${cur - 1}px`
          : `${cur + 1}px`
      }
      else if (prop == 'inset') {
        updated[payload.propIndex] = direction.includes('down')
          ? ''
          : 'inset'
      }
      else {
        updated[payload.propIndex] = direction.includes('left') || direction.includes('up')
          ? `${cur - 1}px`
          : `${cur + 1}px`
      }

      payload.value = updated
      return payload
    })
    .forEach(({el, style, value}) =>
      el.style[style] = value.join(' '))
}
