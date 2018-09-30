import { desiredPropMap } from './design-properties'

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