// setup ports
const connections = {}

chrome.runtime.onConnect.addListener(port => {
  console.log("pixelbug onConnect", port)

  if (port.name != 'panel' && port.name != 'content') {
    console.warn(port)
    return
  }

  port.onMessage.addListener(message => {
    console.log("pixelbug port.onMessage", message, port)
    
    const tabId = port.sender.tab 
      ? port.sender.tab.id 
      : message.tabId

    if (message.action == 'init') {
      if (!connections[tabId])
        connections[tabId] = {}

      connections[tabId][port.name] = port
      console.info('pixelbug init update', connections)
      return
    }

    if (message.target) {
      const conn = connections[tabId][message.target]
      conn && conn.postMessage(message)
    }
    else
      console.warn('pixelbug missing message target')
  })

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("pixelbug runtime.onMessage", request, sender)

    // Messages from content scripts should have sender.tab set.
    // The are all relayed to the "panel" connection.
    if (request.target == "content" && request.tabId) {
      chrome.tabs.sendMessage(request.tabId, request)
    }

    return true
  })
})


// add/remove pixelbug
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
  title: "Inspect"
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

