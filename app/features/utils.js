import $ from 'blingblingjs'

export const getSide = direction => {
  let start = direction.split('+').pop().replace(/^\w/, c => c.toUpperCase())
  if (start == 'Up') start = 'Top'
  if (start == 'Down') start = 'Bottom'
  return start
}

export const getStyle = (el, name) => {
  if (document.defaultView && document.defaultView.getComputedStyle) {
    name = name.replace(/([A-Z])/g, '-$1')
    name = name.toLowerCase()
    let s = document.defaultView.getComputedStyle(el, '')
    return s && s.getPropertyValue(name)
  } 
}

export const desiredPropMap = {
  color:                'rgb(0, 0, 0)',
  backgroundColor:      'rgba(0, 0, 0, 0)',
  backgroundImage:      'none',
  backgroundSize:       'auto',
  backgroundPosition:   '0% 0%',
  // borderColor:          'rgb(0, 0, 0)',
  borderWidth:          '0px',
  borderRadius:         '0px',
  boxShadow:            'none',
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
  fill:                 'rgb(0, 0, 0)',
  stroke:               'none',
}

export const desiredAccessibilityMap = [
  'role',
  'tabindex',
  'aria-*',
  'for',
  'alt',
]

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

export const getA11ys = el => {
  const elAttributes = el.getAttributeNames()

  return desiredAccessibilityMap.reduce((acc, attribute) => {
    if (elAttributes.includes(attribute))
      acc.push({
        prop:   attribute,
        value:  el.getAttribute(attribute)
      })

    if (attribute === 'aria-*')
      elAttributes.forEach(attr => {
        if (attr.includes('aria'))
          acc.push({
            prop:   attr,
            value:  el.getAttribute(attr)
          })
      })

    return acc
  }, [])
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

export const camelToDash = (camelString = "") =>
  camelString.replace(/([A-Z])/g, ($1) =>
    "-"+$1.toLowerCase())

export const htmlStringToDom = (htmlString = "") =>
  (new DOMParser().parseFromString(htmlString, 'text/html')).body.firstChild

export const createClassname = el => {
  if (!el.className || el.nodeName === 'svg' || el.ownerSVGElement) return ''
  let rawClassname = '.' + el.className.replace(/ /g, '.')

  return rawClassname.length > 30
    ? rawClassname.substring(0,30) + '...'
    : rawClassname
}

export const isOffBounds = node =>
  node.closest &&
  (node.closest('tool-pallete') 
  || node.closest('hotkey-map')
  || node.closest('pb-metatip')
  || node.closest('pb-label')
  || node.closest('pb-handles')
  || node.closest('pb-gridlines')
  )

export const nodeKey = node => {
  let tree = []
  let furthest_leaf = node

  while (furthest_leaf) {
    tree.push(furthest_leaf)
    furthest_leaf = furthest_leaf.parentNode
      ? furthest_leaf.parentNode
      : false
  }

  return tree.reduce((path, branch) => `
    ${path}${branch.tagName}_${branch.className}_${[...node.parentNode.children].indexOf(node)}_${node.children.length}
  `, '')
}
