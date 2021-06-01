export const isFirefox = navigator.userAgent.search('Firefox') > 0
export const isSafarish = navigator.userAgent.search('Safari') > 0
export const isChrome = navigator.userAgent.search('Chrome') > 0
export const isSafari = isSafarish && !isChrome

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
