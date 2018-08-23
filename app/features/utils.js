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

export const desiredPropMap = {
  color:                'rgb(0, 0, 0)',
  backgroundColor:      'rgba(0, 0, 0, 0)',
  backgroundImage:      'none',
  backgroundSize:       'auto',
  backgroundPosition:   '0% 0%',
  // border:               '0px none rgb(0, 0, 0)',
  borderRadius:         '0px',
  padding:              '0px',
  margin:               '0px',
  fontFamily:           '',
  fontSize:             '16px',
  fontWeight:           '400',
  textAlign:            'start',
  textShadow:           'none',
  textTransform:        'none',
  lineHeight:           'normal',
  display:              'block',
  alignItems:           'normal',
  justifyContent:       'normal',
}

export function getStyles(el) {
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

  if (timeoutMap[nodeKey(el)]) 
    clearTimeout(timeoutMap[nodeKey(el)])

  timeoutMap[nodeKey(el)] = setTimeout(_ => {
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

export function isOffBounds(node) {
  return node.closest &&
      (node.closest('tool-pallete') 
    || node.closest('hotkey-map')
    || node.closest('.pb-metatip')
    || node.closest('.pb-selectedlabel')
    )
}

export function nodeKey(node) {
  return `${node.nodeName}_${node.className}_${[...node.parentNode.children].indexOf(node)}_${node.children.length}_${node.clientWidth}`
}
