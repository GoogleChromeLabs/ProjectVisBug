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

export function rgb2hex(rgb) {
 return '#' + rgb.substr(4, rgb.indexOf(')') - 4).split(',').map((color) => parseInt(color).toString(16)).join('')
}

let timeoutMap = {}
export function showHideSelected(el) {
  el.setAttribute('data-selected-hide', true)

  if (timeoutMap[el]) clearTimeout(timeoutMap[el])

  timeoutMap[el] = setTimeout(_ =>
    el.removeAttribute('data-selected-hide')
  , 750)
  
  return el
}