export const commands = [
  'translate',
]

const createTranslateContainer = () => {
  const node = document.createElement('div')
  node.setAttribute('google_translate_element', '')
  node.style.display = 'none'
  return node
}

export default async function() {
  window.googleTranslateElementInit = () =>
    new google.translate.TranslateElement({
      pageLanguage: 'en', 
      layout:       google.translate.TranslateElement.InlineLayout.SIMPLE,
    }, 'google_translate_element')

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