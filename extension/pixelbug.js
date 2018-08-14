let state = {
  loaded:   {},
  injected: false,
}

chrome.browserAction.onClicked.addListener(function(tab) {
  if (state.loaded[tab.id] && state.injected) {
    chrome.tabs.executeScript(tab.id, { file: 'toolbar/eject.js' })
    state.injected = false
  }
  else if (state.loaded[tab.id] && !state.injected) {
    chrome.tabs.executeScript(tab.id, { file: 'toolbar/inject.js' })
    state.injected = true
  }
  else {
    chrome.tabs.insertCSS(tab.id,     { file: 'toolbar/bundle.css' })
    chrome.tabs.executeScript(tab.id, { file: 'web-components.polyfill.js' })
    chrome.tabs.executeScript(tab.id, { file: 'toolbar/bundle.js' })
    chrome.tabs.executeScript(tab.id, { file: 'toolbar/inject.js' })

    state.loaded[tab.id]    = true
    state.injected          = true
  }
})