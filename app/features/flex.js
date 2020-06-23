import hotkeys from 'hotkeys-js'
import { metaKey, getStyle } from '../utilities/'
import { createMeasurements, clearMeasurements } from './measurements'

const key_events = 'up,down,left,right'
  .split(',')
  .reduce((events, event) =>
    `${events},${event},shift+${event}`
  , '')
  .substring(1)

const command_events = `${metaKey}+up,${metaKey}+down,${metaKey}+left,${metaKey}+right,${metaKey}+shift+up,${metaKey}+shift+down,${metaKey}+shift+left,${metaKey}+shift+right`

export function Flex(visbug) {
  visbug.onSelectedUpdate(highlight)

  hotkeys(key_events, (e, handler) => {
    if (e.cancelBubble) return

    e.preventDefault()

    let selectedNodes = visbug.selection()
      , keys = handler.key.split('+')

    selectedNodes.forEach(node => {
      const direction = getStyle(node, 'flexDirection')
      
      if (direction === 'row') {
        if (keys.includes('left') || keys.includes('right'))
          keys.includes('shift')
            ? changeHDistribution(selectedNodes, handler.key)
            : changeHAlignment(selectedNodes, handler.key)
        else
          keys.includes('shift')
            ? changeVDistribution(selectedNodes, handler.key)
            : changeVAlignment(selectedNodes, handler.key)
      }
      else {
        debugger
      }
    })
  })

  hotkeys(command_events, (e, handler) => {
    e.preventDefault()

    let selectedNodes = visbug.selection()
      , keys = handler.key.split('+')

    if (keys.includes('left') || keys.includes('right'))
      keys.includes('shift')
        ? changeOrder(selectedNodes, handler.key)
        : changeDirection(selectedNodes, 'row')
    else
      keys.includes('shift')
        ? changeWrap(selectedNodes, handler.key)
        : changeDirection(selectedNodes, 'column')
  })

  return () => {
    hotkeys.unbind(key_events)
    hotkeys.unbind(command_events)
    hotkeys.unbind('up,down,left,right')
    visbug.removeSelectedCallback(highlightChildren)
  }
}

const ensureFlex = el => {
  el.style.display = 'flex'
  return el
}

const accountForOtherJustifyContent = (cur, want) => {
  if (want == 'align' && (cur != 'flex-start' && cur != 'center' && cur != 'flex-end'))
    cur = 'normal'
  else if (want == 'distribute' && (cur != 'space-around' && cur != 'space-between'))
    cur = 'normal'

  return cur
}

const highlight = els => {
  els.forEach(el => {
    // showBadge(el) // indicate if a flex box
    highlightChildren(el)
    showGaps(el)
    // showAlignment(el)
  })
}

const highlightChildren = el => {
  [...el.children].forEach(child => {
    const child_hover = document.createElement('visbug-hover')
    child_hover.position = {el: child}
    document.body.appendChild(child_hover)
  })
}

const showGaps = el => {
  const direction = getStyle(el, 'flexDirection')
  const container = {
    bounds: el.getBoundingClientRect(),
    el,
  }

  const computed = Array.from(el.children)
    .map((child, i) => ({
      child,
      index: i,
      bounds: child.getBoundingClientRect(),
    }))

  const gaps = computed
    .filter(payload =>
      el.lastElementChild !== payload.child)
    .map(child =>
      createGap({
        container,
        anchor: child, 
        sibling: computed[child.index+1], 
        direction,
      }))

  const label_id = el.getAttribute('data-label-id')
  const handle = document
    .querySelector(`visbug-handles[data-label-id="${label_id}"]`)

  // todo: track these? or let handles clean them up?
  // measurents are child of gap
  // gap is child of handle and relatively positioned
  gaps.forEach(gap => {
    handle.gap = gap
  })
}

const createGap = ({container, anchor, sibling, direction}) => {
  const gap = document.createElement('visbug-boxmodel')

  // todo: not make a gap if 
  // - negative widths
  // - nodes outside of the container bounds 
  // isn't measuring to a child
  if (direction.includes('row')) {
    gap.position = {
      mode: 'gap',
      color: 'pink',
      bounds: container.bounds,
      sides: {
        top: container.bounds.top,
        left: anchor.bounds.right,
        height: container.bounds.height,
        width: sibling.bounds.left - anchor.bounds.right,
        rotation: 'rotate(90)',
        direction,
      },
    }
  }
  else {
    gap.position = {
      mode: 'gap',
      color: 'pink',
      bounds: container.bounds,
      sides: {
        top: anchor.bounds.bottom,
        left: container.bounds.left,
        height: sibling.bounds.top - anchor.bounds.bottom,
        width: container.bounds.width,
        rotation: 'rotate(0)',
        direction,
      },
    }
  }

  return gap
}

// todo: support reversing direction
export function changeDirection(els, value) {
  els
    .map(ensureFlex)
    .map(el => {
      el.style.flexDirection = value
    })
}

const h_alignMap      = {normal: 0,'flex-start': 0,'center': 1,'flex-end': 2,}
const h_alignOptions  = ['flex-start','center','flex-end']

export function changeHAlignment(els, direction) {
  els
    .map(ensureFlex)
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
}

const v_alignMap      = {normal: 0,'flex-start': 0,'center': 1,'flex-end': 2,}
const v_alignOptions  = ['flex-start','center','flex-end']

export function changeVAlignment(els, direction) {
  els
    .map(ensureFlex)
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
}

const h_distributionMap      = {normal: 1,'space-around': 0,'': 1,'space-between': 2,}
const h_distributionOptions  = ['space-around','','space-between']

export function changeHDistribution(els, direction) {
  els
    .map(ensureFlex)
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
}

const v_distributionMap      = {normal: 1,'space-around': 0,'': 1,'space-between': 2,}
const v_distributionOptions  = ['space-around','','space-between']

export function changeVDistribution(els, direction) {
  els
    .map(ensureFlex)
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
}

const orderMap     = {row: 0, 'row-reverse': 1, column: 2, 'column-reverse': 3,}
const orderOptions = ['row', 'row-reverse', 'column', 'column-reverse']

export function changeOrder(els, direction) {
  els
    .map(ensureFlex)
    .map(el => ({
      el,
      style: 'flexDirection',
      current: getStyle(el, 'flexDirection'),
      direction: direction.split('+').includes('left'),
    }))
    .map(payload =>
      Object.assign(payload, {
        value: payload.direction
          ? orderMap[payload.current] === 1 || orderMap[payload.current] === 3
            ? orderMap[payload.current] : orderMap[payload.current] + 1
          : orderMap[payload.current] === 0 || orderMap[payload.current] === 2
            ? orderMap[payload.current] : orderMap[payload.current] - 1
      }))
      .forEach(({el, style, value}) =>
        el.style[style] = orderOptions[value])
}

const wrapMap     = {nowrap: 0, 'wrap': 1,}
const wrapOptions = ['nowrap', 'wrap']

export function changeWrap(els, direction) {
  els
    .map(ensureFlex)
    .map(el => ({
      el,
      style: 'flexWrap',
      current: getStyle(el, 'flexWrap'),
      direction: direction.split('+').includes('up'),
    }))
    .map(payload =>
      Object.assign(payload, {
        value: payload.direction
          ? wrapMap[payload.current] === 0
            ? wrapMap[payload.current] : wrapMap[payload.current] - 1
          : wrapMap[payload.current] === 1
            ? wrapMap[payload.current] : wrapMap[payload.current] + 1
      }))
      .forEach(({el, style, value}) =>
        el.style[style] = wrapOptions[value])
}
