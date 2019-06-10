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
  id:       'launcher',
  title:    'Toggle',
  contexts: ['all'],
})

// todo: load values from ext storage
const color_options = {
  hsla: {
    checked: true,
  },
  hex: {
    checked: false,
  },
  rgba: {
    checked: false,
  },
  // 'as authored',
  // 'lch'
}

Object
  .entries(color_options)
  .forEach(([key, {checked}]) => {
    chrome.contextMenus.create({
      id:       key,
      title:    key,
      checked:  checked,
      type:     'radio',
      contexts: ['all'],
    })
})

chrome.contextMenus.onClicked.addListener(({menuItemId}, tab) => {
  // toggle visbug active state
  if (menuItemId === 'launcher') {
    toggleIn(tab)

    // chrome.tabs.query({active: true, currentWindow: true}, function([tab]) {
    //   tab && chrome.tabs.sendMessage(tab.id, {
    //     action: 'toolSelected',
    //     params: 'inspector',
    //   })
    // })
  }
  else {
    chrome.tabs.query({active: true, currentWindow: true}, function([tab]) {
      tab && chrome.tabs.sendMessage(tab.id, {
        action: 'colorMode',
        params: menuItemId,
      })
    })
  }
})
