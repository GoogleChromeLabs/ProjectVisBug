import { desiredAccessibilityMap, desiredPropMap, largeWCAG2TextMap } from './design-properties'
import { getStyles } from './styles'

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

export const getWCAG2TextSize = el => {
  
  const styles = getStyles(el).reduce((styleMap, style) => {
      styleMap[style.prop] = style.value
      return styleMap
  }, {})

  const { fontSize   = desiredPropMap.fontSize,
          fontWeight = desiredPropMap.fontWeight
      } = styles
  
  const isLarge = largeWCAG2TextMap.some(
    (largeProperties) => parseFloat(fontSize) >= parseFloat(largeProperties.fontSize) 
       && parseFloat(fontWeight) >= parseFloat(largeProperties.fontWeight) 
  )

  return  isLarge ? 'Large' : 'Small'
}