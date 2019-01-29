let state = {
  loaded:   {},
  injected: {},
}

chrome.browserAction.onClicked.addListener(function(tab) {
  if (state.loaded[tab.id] && state.injected[tab.id]) {
    chrome.tabs.executeScript(tab.id, { file: 'toolbar/eject.js' })
    state.injected[tab.id] = false
  }
  else if (state.loaded[tab.id] && !state.injected[tab.id]) {
    chrome.tabs.executeScript(tab.id, { file: 'toolbar/inject.js' })
    state.injected[tab.id] = true
  }
  else {
    chrome.tabs.insertCSS(tab.id,     { file: 'toolbar/bundle.css' })
    chrome.tabs.executeScript(tab.id, { file: 'web-components.polyfill.js' })
    chrome.tabs.executeScript(tab.id, { file: 'toolbar/bundle.js' })
    chrome.tabs.executeScript(tab.id, { file: 'toolbar/inject.js' })

    state.loaded[tab.id]    = true
    state.injected[tab.id]  = true
  }

  chrome.tabs.onUpdated.addListener(function(tabId) {
    if (tabId === tab.id)
      state.loaded[tabId] = false
  })
})