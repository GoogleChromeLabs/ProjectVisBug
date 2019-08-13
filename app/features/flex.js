import $ from 'blingblingjs'
import hotkeys from 'hotkeys-js'
import { metaKey, getStyle } from '../utilities/'

const key_events = 'up,down,left,right'
  .split(',')
  .reduce((events, event) =>
    `${events},${event},shift+${event}`
  , '')
  .substring(1)

const command_events = `${metaKey}+up,${metaKey}+down,${metaKey}+left,${metaKey}+right`

export function Flex(visbug) {
  hotkeys(key_events, (e, handler) => {
    if (e.cancelBubble) return

    e.preventDefault()

    let selectedNodes = visbug.selection()
      , keys = handler.key.split('+')

    if (keys.includes('left') || keys.includes('right'))
      keys.includes('shift')
        ? changeHDistribution(selectedNodes, handler.key)
        : changeHAlignment(selectedNodes, handler.key)
    else
      keys.includes('shift')
        ? changeVDistribution(selectedNodes, handler.key)
        : changeVAlignment(selectedNodes, handler.key)
  })

  hotkeys(command_events, (e, handler) => {
    e.preventDefault()

    let selectedNodes = visbug.selection()
      , keys = handler.key.split('+')

    if (keys.includes('left') || keys.includes('right'))
      changeDirection(selectedNodes, 'row')
    else
      changeDirection(selectedNodes, 'column')
  })

  visbug.onSelectedUpdate(onSelectedUpdateHandler)

  return () => {
    hotkeys.unbind(key_events)
    hotkeys.unbind(command_events)
    hotkeys.unbind('up,down,left,right')
    visbug.removeSelectedCallback(onSelectedUpdateHandler)
  }
}

export const ensureFlex = (el) => el.style.display = 'flex'
export const assignLabel = (el) => $(el).attr('data-label', `display: ${getComputedStyle(el).display}`)

const ensureFlexAndAssignLabel = callback => (els, ...args) => {
  els.forEach(el => { 
    ensureFlex(el)
    assignLabel(el)
  })

  return callback(els, ...args)
}

const accountForOtherJustifyContent = (cur, want) => {
  if (want == 'align' && (cur != 'flex-start' && cur != 'center' && cur != 'flex-end'))
    cur = 'normal'
  else if (want == 'distribute' && (cur != 'space-around' && cur != 'space-between'))
    cur = 'normal'

  return cur
}

// todo: support reversing direction
export const changeDirection = ensureFlexAndAssignLabel(
  (els, value) => els.forEach(el => el.style.flexDirection = value)
);

const h_alignMap      = {normal: 0,'flex-start': 0,'center': 1,'flex-end': 2,}
const h_alignOptions  = ['flex-start','center','flex-end']

export const changeHAlignment = ensureFlexAndAssignLabel(
  (els, direction) => 
    els
      .map(el => ({
        el,
        style:    'justifyContent',
        current:  accountForOtherJustifyContent(getStyle(el, 'justifyContent'), 'align'),
        direction: direction.split('+').includes('left'),
      }))
      .map(payload =>
        Object.assign(payload, {
          value: payload.direction
            ? h_alignMap[payload.current] - 1
            : h_alignMap[payload.current] + 1
        }))
      .forEach(({el, style, value}) =>
        el.style[style] = h_alignOptions[value < 0 ? 0 : value >= 2 ? 2: value])
)

const v_alignMap      = {normal: 0,'flex-start': 0,'center': 1,'flex-end': 2,}
const v_alignOptions  = ['flex-start','center','flex-end']

export const changeVAlignment = ensureFlexAndAssignLabel(
  (els, direction) => 
    els
      .map(el => ({
        el,
        style:    'alignItems',
        current:  getStyle(el, 'alignItems'),
        direction: direction.split('+').includes('up'),
      }))
      .map(payload =>
        Object.assign(payload, {
          value: payload.direction
            ? h_alignMap[payload.current] - 1
            : h_alignMap[payload.current] + 1
        }))
      .forEach(({el, style, value}) =>
        el.style[style] = v_alignOptions[value < 0 ? 0 : value >= 2 ? 2: value])
)

const h_distributionMap      = {normal: 1,'space-around': 0,'': 1,'space-between': 2,}
const h_distributionOptions  = ['space-around','','space-between']

export const changeHDistribution = ensureFlexAndAssignLabel(
  (els, direction) => 
    els
      .map(el => ({
        el,
        style:    'justifyContent',
        current:  accountForOtherJustifyContent(getStyle(el, 'justifyContent'), 'distribute'),
        direction: direction.split('+').includes('left'),
      }))
      .map(payload =>
        Object.assign(payload, {
          value: payload.direction
            ? h_distributionMap[payload.current] - 1
            : h_distributionMap[payload.current] + 1
        }))
      .forEach(({el, style, value}) =>
        el.style[style] = h_distributionOptions[value < 0 ? 0 : value >= 2 ? 2: value])
)

const v_distributionMap      = {normal: 1,'space-around': 0,'': 1,'space-between': 2,}
const v_distributionOptions  = ['space-around','','space-between']

export const changeVDistribution = ensureFlexAndAssignLabel(
  (els, direction) =>
    els
      .map(el => ({
        el,
        style:    'alignContent',
        current:  getStyle(el, 'alignContent'),
        direction: direction.split('+').includes('up'),
      }))
      .map(payload =>
        Object.assign(payload, {
          value: payload.direction
            ? v_distributionMap[payload.current] - 1
            : v_distributionMap[payload.current] + 1
        }))
      .forEach(({el, style, value}) =>
        el.style[style] = v_distributionOptions[value < 0 ? 0 : value >= 2 ? 2: value])
)

function onSelectedUpdateHandler(els) {
  els.forEach(assignLabel)
}