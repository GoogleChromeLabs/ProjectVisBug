const state = {
  loaded:   {},
  injected: {},
}

const toggleIn = ({id:tab_id}) => {
  // toggle out: it's currently loaded and injected
  if (state.loaded[tab_id] && state.injected[tab_id]) {
    chrome.tabs.executeScript(tab_id, { file: 'toolbar/eject.js' })
    state.injected[tab_id] = false
  }

  // toggle in: it's loaded and needs injected
  else if (state.loaded[tab_id] && !state.injected[tab_id]) {
    chrome.tabs.executeScript(tab_id, { file: 'toolbar/inject.js' })
    state.injected[tab_id] = true
  }

  // fresh start in tab
  else {
    chrome.tabs.insertCSS(tab_id,     { file: 'toolbar/bundle.css' })
    chrome.tabs.executeScript(tab_id, { file: 'web-components.polyfill.js' })
    chrome.tabs.executeScript(tab_id, { file: 'toolbar/bundle.js' })
    chrome.tabs.executeScript(tab_id, { file: 'toolbar/inject.js' })

    state.loaded[tab_id]    = true
    state.injected[tab_id]  = true
  }

  chrome.tabs.onUpdated.addListener(function(tabId) {
    if (tabId === tab_id)
      state.loaded[tabId] = false
  })
}

chrome.browserAction.onClicked.addListener(toggleIn)

chrome.contextMenus.create({
  title: 'Debug'
})

chrome.contextMenus.onClicked.addListener((menuInfo, tab) => {
  toggleIn(tab)

  chrome.tabs.query({active: true, currentWindow: true}, function([tab]) {
    tab && chrome.tabs.sendMessage(tab.id, {
      action: 'toolSelected',
      params: 'inspector',
    })
  })
})
