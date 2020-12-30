export const isFirefox = navigator.userAgent.search('Firefox')

export const isPolyfilledCE = shadow_node =>
  shadow_node.children.length === 1 && shadow_node.firstElementChild.nodeName === 'STYLE'
    ? true
    : false

const testConstructible = () => {
  try {
    new window.CSSStyleSheet('a{}')
    return true
  }
  catch (e) {
    return false
  }
}

export const constructibleStylesheetSupport = testConstructible()
