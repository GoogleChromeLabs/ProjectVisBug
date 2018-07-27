let init_map = {}

chrome.browserAction.onClicked.addListener(function (tab) {
  if (init_map[tab.id]) return

  chrome.tabs.insertCSS(tab.id, { file: 'toolbar/bundle.css' })

  chrome.tabs.executeScript(tab.id, { file: 'web-components.polyfill.js' })
  chrome.tabs.executeScript(tab.id, { file: 'toolbar/bundle.js' })
  chrome.tabs.executeScript(tab.id, { file: 'toolbar/inject.js' })

  init_map[tab.id] = true
})