import $ from 'blingblingjs'
import { nodeKey } from './strings'

export const getSide = direction => {
  let start = direction.split('+').pop().replace(/^\w/, c => c.toUpperCase())
  if (start == 'Up') start = 'Top'
  if (start == 'Down') start = 'Bottom'
  return start
}

export const getNodeIndex = el => {
  return [...el.parentElement.parentElement.children]
    .indexOf(el.parentElement)
}

export function showEdge(el) {
  return el.animate([
    { outline: '1px solid transparent' },
    { outline: '1px solid hsla(330, 100%, 71%, 80%)' },
    { outline: '1px solid transparent' },
  ], 600)
}

let timeoutMap = {}
export const showHideSelected = (el, duration = 750) => {
  el.setAttribute('data-selected-hide', true)
  showHideNodeLabel(el, true)

  if (timeoutMap[nodeKey(el)]) 
    clearTimeout(timeoutMap[nodeKey(el)])

  timeoutMap[nodeKey(el)] = setTimeout(_ => {
    el.removeAttribute('data-selected-hide')
    showHideNodeLabel(el, false)
  }, duration)
  
  return el
}

export const showHideNodeLabel = (el, show = false) => {
  if (!el.hasAttribute('data-label-id')) 
    return

  const nodes = $(`
    visbug-label[data-label-id="${el.getAttribute('data-label-id')}"],
    visbug-handles[data-label-id="${el.getAttribute('data-label-id')}"]
  `)

  nodes.length && show
    ? nodes.forEach(el =>
      el.style.display = 'none')
    : nodes.forEach(el =>
      el.style.display = null)
}

export const htmlStringToDom = (htmlString = "") =>
  (new DOMParser().parseFromString(htmlString, 'text/html'))
    .body.firstChild

export const isOffBounds = node =>
  node.closest &&
  (node.closest('tool-pallete') 
  || node.closest('hotkey-map')
  || node.closest('visbug-metatip')
  || node.closest('visbug-ally')
  || node.closest('visbug-label')
  || node.closest('visbug-handles')
  || node.closest('visbug-gridlines')
  )