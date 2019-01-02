import { desiredPropMap } from './design-properties.js'

export const getStyle = (el, name) => {
  if (document.defaultView && document.defaultView.getComputedStyle) {
    name = name.replace(/([A-Z])/g, '-$1')
    name = name.toLowerCase()
    let s = document.defaultView.getComputedStyle(el, '')
    return s && s.getPropertyValue(name)
  } 
}

export const getStyles = el => {
  const elStyleObject = el.style
  const computedStyle = window.getComputedStyle(el, null)

  let desiredValues = []

  for (prop in el.style)
    if (prop in desiredPropMap && desiredPropMap[prop] != computedStyle[prop])
      desiredValues.push({
        prop,
        value: computedStyle[prop].replace(/, rgba/g, '\rrgba')
      })

  return desiredValues
}

export const getComputedBackgroundColor = el => {
  let background = getStyle(el, 'background-color')

  if (background === 'rgba(0, 0, 0, 0)') {
    let node  = el.parentNode
      , found = false

    while(!found) {
      let bg  = getStyle(node, 'background-color')

      if (bg !== 'rgba(0, 0, 0, 0)') {
        found = true
        background = bg
      }

      node = node.parentNode
    }
  }

  return background
}

export const loadStyles = async stylesheets => {
  const fetches = await Promise.all(stylesheets.map(url => fetch(url)))
  const texts   = await Promise.all(fetches.map(url => url.text()))
  const style   = document.createElement('style')

  style.textContent = texts.reduce((styles, fileContents) => 
    styles + fileContents
  , '')

  document.head.appendChild(style)
}
