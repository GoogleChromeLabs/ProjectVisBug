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

  const vettedStyles = Object.entries(el.style)
    .filter(([prop]) => prop !== 'borderColor')
    .filter(([prop]) => desiredPropMap[prop])
    .filter(([prop]) => desiredPropMap[prop] != computedStyle[prop])
    .map(([prop, value]) => ({
      prop, 
      value: computedStyle[prop].replace(/, rgba/g, '\rrgba'),
    }))

  // below code sucks, but border-color is only something
  // we want if it has border width > 0
  // i made it look really hard
  const trueBorderColors = Object.entries(el.style)
    .filter(([prop]) => prop === 'borderColor' || prop === 'borderWidth')
    .map(([prop, value]) => ([
      prop, 
      computedStyle[prop].replace(/, rgba/g, '\rrgba'),
    ]))

  const { borderColor, borderWidth } = Object.fromEntries(trueBorderColors)
  const vettedBorders = []

  if (parseInt(borderWidth) > 0)
    vettedBorders.push({
      prop: 'borderColor',
      value: borderColor,
    })

  return [
    ...vettedStyles, 
    ...vettedBorders,
  ].sort(function({prop:propA}, {prop:propB}) {
    if (propA < propB) return -1
    if (propA > propB) return 1
    return 0
  })
}

export const getComputedBackgroundColor = el => {
  let background = getStyle(el, 'background-color')

  if (background === 'rgba(0, 0, 0, 0)') {
    let node  = findNearestParentElement(el)
      , found = false

    while(!found) {
      let bg  = getStyle(node, 'background-color')

      if (bg !== 'rgba(0, 0, 0, 0)') {
        found = true
        background = bg
      }

      node = findNearestParentElement(node)

      if (node.nodeName === 'HTML') {
        found = true
        background = 'white'
      }
    }
  }

  return background
}

export const findNearestParentElement = el =>
  el.parentNode && el.parentNode.nodeType === 1
    ? el.parentNode
    : el.parentNode.nodeName === '#document-fragment'
      ? el.parentNode.host
      : el.parentNode.parentNode.host

export const findNearestChildElement = el => {
  if (el.shadowRoot && el.shadowRoot.children.length) {
    return [...el.shadowRoot.children]
      .filter(({nodeName}) => 
        !['LINK','STYLE','SCRIPT','HTML','HEAD'].includes(nodeName)
      )[0]
  }
  else if (el.children.length)
    return el.children[0]
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

// returns [full, color, x, y, blur, spread]
export const getShadowValues = shadow =>
  /([^\)]+\)) ([^\s]+) ([^\s]+) ([^\s]+) ([^\s]+)/.exec(shadow)

// returns [full, color, x, y, blur]
export const getTextShadowValues = shadow =>
  /([^\)]+\)) ([^\s]+) ([^\s]+) ([^\s]+)/.exec(shadow)
