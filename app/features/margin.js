import hotkeys from 'hotkeys-js'
import { metaKey, getStyle, getSide, showHideSelected } from '../utilities/'

const key_events = 'up,down,left,right'
  .split(',')
  .reduce((events, event) =>
    `${events},${event},alt+${event},shift+${event},shift+alt+${event}`
  , '')
  .substring(1)

const command_events = `${metaKey}+up,${metaKey}+shift+up,${metaKey}+down,${metaKey}+shift+down`

export function Margin(visbug) {
  hotkeys(key_events, (e, handler) => {
    if (e.cancelBubble) return

    e.preventDefault()
    pushElement(visbug.selection(), handler.key)
  })

  hotkeys(command_events, (e, handler) => {
    e.preventDefault()
    pushAllElementSides(visbug.selection(), handler.key)
  })

  visbug.onSelectedUpdate(paintBackgrounds)

  return () => {
    hotkeys.unbind(key_events)
    hotkeys.unbind(command_events)
    hotkeys.unbind('up,down,left,right') // bug in lib?
    visbug.removeSelectedCallback(paintBackgrounds)
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

function paintBackgrounds(els) {
  els.forEach(el => {
    const label_id = el.getAttribute('data-label-id')

    document
      .querySelector(`visbug-label[data-label-id="${label_id}"]`)
      .style.opacity = 0

    document
      .querySelector(`visbug-handles[data-label-id="${label_id}"]`)
      .backdrop = {
        markup: paintBackground(el, label_id),
        update: paintBackground,
      }
  })
}

function paintBackground(el, label_id) {
  const bounds            = el.getBoundingClientRect()
  const styleOM           = el.computedStyleMap()
  const calculatedStyle   = getStyle(el, 'margin')

  const margin = {
    top:    styleOM.get('margin-top').value,
    right:  styleOM.get('margin-right').value,
    bottom: styleOM.get('margin-bottom').value,
    left:   styleOM.get('margin-left').value,
  }
  
  if (calculatedStyle === '0px')
    return

  const total_height  = bounds.height + margin.bottom + margin.top
  const total_width   = bounds.width + margin.right + margin.left

  return `
    <div style="
      position: absolute;
      z-index: 1;
      width: ${total_width}px;
      height: ${total_height}px;
      top: ${bounds.top + window.scrollY - margin.top}px;
      left: ${bounds.left - margin.left}px;
      background-color: hsla(330, 100%, 71%, 15%);
      clip-path: polygon(
        0% 0%, 0% 100%, ${margin.left}px 100%, 
        ${margin.left}px ${margin.top}px, 
        ${total_width - margin.right}px ${margin.top}px, 
        ${total_width - margin.right}px ${total_height - margin.bottom}px, 
        0 ${total_height - margin.bottom}px, 0 100%, 
        100% 100%, 100% 0%
      );
    ">
      <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
        <defs>
          <pattern id="pinstripe" patternUnits="userSpaceOnUse" width="10" height="10" patternTransform="rotate(45)" class="pattern">
            <line x1="0" y="0" x2="0" y2="10" stroke="hsla(330, 100%, 71%, 80%)" stroke-width="1"></line>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#pinstripe)"></rect>
      </svg>
    </div>
   `
}
