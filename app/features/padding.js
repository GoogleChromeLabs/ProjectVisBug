import hotkeys from 'hotkeys-js'
import { metaKey, getStyle, getSide, showHideSelected } from '../utilities/'

const key_events = 'up,down,left,right'
  .split(',')
  .reduce((events, event) =>
    `${events},${event},alt+${event},shift+${event},shift+alt+${event}`
  , '')
  .substring(1)

const command_events = `${metaKey}+up,${metaKey}+shift+up,${metaKey}+down,${metaKey}+shift+down`

export function Padding(visbug) {
  hotkeys(key_events, (e, handler) => {
    if (e.cancelBubble) return

    e.preventDefault()
    padElement(visbug.selection(), handler.key)
  })

  hotkeys(command_events, (e, handler) => {
    e.preventDefault()
    padAllElementSides(visbug.selection(), handler.key)
  })

  visbug.onSelectedUpdate(paintBackground)

  return () => {
    hotkeys.unbind(key_events)
    hotkeys.unbind(command_events)
    hotkeys.unbind('up,down,left,right') // bug in lib?
    visbug.removeSelectedCallback(paintBackground)
  }
}

export function padElement(els, direction) {
  els
    .map(el => showHideSelected(el))
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
      el.style[style] = `${padding < 0 ? 0 : padding}px`)
}

export function padAllElementSides(els, keycommand) {
  const combo = keycommand.split('+')
  let spoof = ''

  if (combo.includes('shift'))  spoof = 'shift+' + spoof
  if (combo.includes('down'))   spoof = 'alt+' + spoof

  'up,down,left,right'.split(',')
    .forEach(side => padElement(els, spoof + side))
}

function paintBackground(els) {
  els.forEach(el => {
    const label_id          = el.getAttribute('data-label-id')
    const bounds            = el.getBoundingClientRect()
    const styleOM           = el.computedStyleMap()
    const calculatedStyle   = getStyle(el, 'padding')

    const padding = {
      top:    styleOM.get('padding-top').value,
      right:  styleOM.get('padding-right').value,
      bottom: styleOM.get('padding-bottom').value,
      left:   styleOM.get('padding-left').value,
    }

    const $el_handle = document
      .querySelector(`visbug-handles[data-label-id="${label_id}"]`)
      .$shadow

    const handle_style = $el_handle.querySelector('svg').style
    
    if (calculatedStyle === '0px')
      return

    const highlight = document.createElement('div')

    highlight.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
        <defs>
          <pattern id="pinstripe" patternUnits="userSpaceOnUse" width="10" height="10" patternTransform="rotate(-45)" class="pattern">
            <line x1="0" y="0" x2="0" y2="10" stroke="hotpink" stroke-width="1"></line>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#pinstripe)"></rect>
      </svg>
    `

    highlight.style = `
      position: absolute;
      z-index: 1;
      width: ${bounds.width}px;
      height: ${bounds.height}px;
      top: ${bounds.top + window.scrollY}px;
      left: ${bounds.left}px;
      background-color: hsla(330, 100%, 71%, 8%);
      clip-path: polygon(
        0% 0%, 0% 100%, ${padding.left}px 100%, 
        ${padding.left}px ${padding.top}px, 
        ${bounds.width - padding.right}px ${padding.top}px, 
        ${bounds.width - padding.right}px ${bounds.height - padding.bottom}px, 
        0 ${bounds.height - padding.bottom}px, 0 100%, 
        100% 100%, 100% 0%
      );
    `

    const has_child = $el_handle.querySelector('div')

    has_child
      ? $el_handle.replaceChild(highlight, has_child)
      : $el_handle.appendChild(highlight)
  })
}
