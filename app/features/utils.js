export function getSide(direction) {
  let start = direction.split('+').pop().replace(/^\w/, c => c.toUpperCase())
  if (start == 'Up') start = 'Top'
  if (start == 'Down') start = 'Bottom'
  return start
}

export function getStyle(elem, name) {
  if (document.defaultView && document.defaultView.getComputedStyle) {
    name = name.replace(/([A-Z])/g, '-$1')
    name = name.toLowerCase()
    let s = document.defaultView.getComputedStyle(elem, '')
    return s && s.getPropertyValue(name)
  } 
  else {
    return null
  }
}

let timeoutMap = {}
export function showHideSelected(el, duration = 750) {
  el.setAttribute('data-selected-hide', true)

  if (timeoutMap[el]) clearTimeout(timeoutMap[el])

  timeoutMap[el] = setTimeout(_ =>
    el.removeAttribute('data-selected-hide')
  , duration)
  
  return el
}