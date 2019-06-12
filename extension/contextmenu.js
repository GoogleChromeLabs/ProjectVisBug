const storagekey = 'visbug-color-mode'
const defaultcolormode = 'hsla'

const color_options = [
  'hsla',
  'hex',
  'rgba',
  // 'as authored',
  // 'lch'
]

const sendColorMode = mode => {
  chrome.tabs.query({active: true, currentWindow: true}, ([tab]) => {
    tab && chrome.tabs.sendMessage(tab.id, {
      action: 'COLOR_MODE',
      params: {mode},
    })
  })
}

// load synced color choice on load
chrome.storage.sync.get([storagekey], value => {
  const found_value = value[storagekey]
  const is_default = found_value
    ? value[storagekey] === defaultcolormode
    : false

  if (!found_value && !is_default) {
    chrome.storage.sync.set({[storagekey]: defaultcolormode})
  }
  else {
    if (!is_default)
      sendColorMode(found_value)

    chrome.contextMenus.update(found_value, {
      checked: true,
    })
  }
})

color_options.forEach(option => {
  chrome.contextMenus.create({
    id:       option,
    title:    ' '+option,
    checked:  false,
    type:     'radio',
    contexts: ['all'],
  })
})

chrome.contextMenus.onClicked.addListener(({menuItemId}, tab) => {
  chrome.storage.sync.set({[storagekey]: menuItemId})
  sendColorMode(menuItemId)
})