import { desiredAccessibilityMap } from './design-properties'

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