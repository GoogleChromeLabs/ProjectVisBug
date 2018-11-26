import $ from 'blingblingjs'
import { nodeKey } from './strings'

export const getSide = direction => {
  const start = direction.split('+').pop().replace(/^\w/, c => c.toUpperCase())
  return start === 'Up' || start === 'Down' ? 'Top' : 'Left'
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
    pb-label[data-label-id="${el.getAttribute('data-label-id')}"],
    pb-handles[data-label-id="${el.getAttribute('data-label-id')}"]
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
  || node.closest('pb-metatip')
  || node.closest('pb-ally')
  || node.closest('pb-label')
  || node.closest('pb-handles')
  || node.closest('pb-gridlines')
  )