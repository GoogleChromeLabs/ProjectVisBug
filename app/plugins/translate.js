export const commands = [
  'translate',
]

const initGoogleTranslate = () => {
  new google.translate.TranslateElement({
    pageLanguage: 'en', 
    layout:       google.translate.TranslateElement.InlineLayout.SIMPLE,
  }, 'google_translate_element')
  
  // fixes offset that breaks selection illusion
  window.requestIdleCallback(() => {
    document.body.style.top         = null
    document.body.style.paddingTop  = '40px'
  })
}

const createTranslateContainer = () => {
  const node = document.createElement('div')
  node.setAttribute('google_translate_element', '')
  node.style.display = 'none'
  return node
}

export default async function() {
  window.googleTranslateElementInit = initGoogleTranslate

  const translateUI = createTranslateContainer()
  document.body.appendChild(translateUI)

  const translateScript = document.createElement('script')
  translateScript.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit'
  document.body.appendChild(translateScript)

  window.location.hash = 'googtrans(en|ja)'
  
  return () => 
    [translateUI, translateScript]
      .forEach(node => 
        node.remove())
}