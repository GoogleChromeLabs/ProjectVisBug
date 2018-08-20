import $ from 'blingblingjs'

export function getSide(direction) {
  let start = direction.split('+').pop().replace(/^\w/, c => c.toUpperCase())
  if (start == 'Up') start = 'Top'
  if (start == 'Down') start = 'Bottom'
  return start
}

export function getStyle(el, name) {
  if (document.defaultView && document.defaultView.getComputedStyle) {
    name = name.replace(/([A-Z])/g, '-$1')
    name = name.toLowerCase()
    let s = document.defaultView.getComputedStyle(el, '')
    return s && s.getPropertyValue(name)
  } 
  else {
    return null
  }
}

export function getStyles(el, desiredPropMap) {
  const elStyleObject = el.style
  const computedStyle = window.getComputedStyle(el, null)

  let desiredValues = []

  for (prop in el.style)
    if (prop in desiredPropMap && desiredPropMap[prop] != computedStyle[prop])
      desiredValues.push({
        prop,
        value: computedStyle[prop]
      })

  return desiredValues
}

let timeoutMap = {}
export function showHideSelected(el, duration = 750) {
  el.setAttribute('data-selected-hide', true)
  showHideNodeLabel(el, true)

  if (timeoutMap[el]) clearTimeout(timeoutMap[el])

  timeoutMap[el] = setTimeout(_ => {
    el.removeAttribute('data-selected-hide')
    showHideNodeLabel(el, false)
  }, duration)
  
  return el
}

export function showHideNodeLabel(el, show = false) {
  if (!el.hasAttribute('data-label-id')) 
    return

  const node = $(`body > div[data-label-id="${el.getAttribute('data-label-id')}"]`)[0]

  node && show
    ? node.style.display = 'none'
    : node.style.display = null
}

export function camelToDash(camelString = "") {
  return camelString.replace(/([A-Z])/g, function($1){return "-"+$1.toLowerCase();})
}

export function htmlStringToDom(htmlString = "") {
  return (new DOMParser().parseFromString(htmlString, 'text/html')).body.firstChild
}

export function createClassname(el) {
  if (!el.className) return ''
  let rawClassname = '.' + el.className.replace(/ /g, '.')

  return rawClassname.length > 30
    ? rawClassname.substring(0,30) + '...'
    : rawClassname
}