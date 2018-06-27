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

let catchingUp = false
let interrupted = 0
export function showHideSelected(el) {
  if (catchingUp) interrupted++
  el.setAttribute('data-selected-hide', true)
  setTimeout(function(){
    if (interrupted > 0) return interrupted--
    el.removeAttribute('data-selected-hide')
    catchingUp = false
  }, 750)
  catchingUp = true
  return el
}