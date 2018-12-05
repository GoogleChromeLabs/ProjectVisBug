import $ from 'blingblingjs'
import hotkeys from 'hotkeys-js'
import { metaKey, getStyle, showHideSelected } from '../utilities/'

const key_events = 'up,down,left,right'
  .split(',')
  .reduce((events, event) =>
    `${events},${event},shift+${event}`
  , '')
  .substring(1)

const command_events = `${metaKey}+up,${metaKey}+shift+up,${metaKey}+down,${metaKey}+shift+down,${metaKey}+left,${metaKey}+shift+left,${metaKey}+right,${metaKey}+shift+right`

export function BoxShadow(selector) {
  hotkeys(key_events, (e, handler) => {
    if (e.cancelBubble) return

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
    keys.includes('left') || keys.includes('right')
      ? changeBoxShadow($(selector), keys, 'opacity')
      : changeBoxShadow($(selector), keys, 'inset')
  })

  return () => {
    hotkeys.unbind(key_events)
    hotkeys.unbind(command_events)
    hotkeys.unbind('up,down,left,right')
  }
}

const ensureHasShadow = el => {
  if (el.style.boxShadow == '' || el.style.boxShadow == 'none')
    el.style.boxShadow = 'hsla(0,0%,0%,30%) 0 0 0 0'
  return el
}

// todo: work around this propMap with a better split
const propMap = {
  'opacity':  3,
  'x':        4,
  'y':        5,
  'blur':     6,
  'size':     7,
  'inset':    8,
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
      let cur     = prop === 'opacity'
        ? payload.current[payload.propIndex]
        : parseInt(payload.current[payload.propIndex])

      switch(prop) {
        case 'blur':
          var amount = direction.includes('shift') ? 10 : 1
          updated[payload.propIndex] = direction.includes('down')
            ? `${cur - amount}px`
            : `${cur + amount}px`
          break
        case 'inset':
          updated[payload.propIndex] = direction.includes('down')
            ? 'inset'
            : ''
          break
        case 'opacity':
          let cur_opacity = parseFloat(cur.slice(0, cur.indexOf(')')))
          var amount = direction.includes('shift') ? 0.10 : 0.01
          updated[payload.propIndex] = direction.includes('left')
            ? cur_opacity - amount + ')'
            : cur_opacity + amount + ')'
          break
        default:
          updated[payload.propIndex] = direction.includes('left') || direction.includes('up')
            ? `${cur - 1}px`
            : `${cur + 1}px`
          break
      }

      payload.value = updated
      return payload
    })
    .forEach(({el, style, value}) =>
      el.style[style] = value.join(' '))
}
