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

chrome.contextMenus.create({
  id:     'color-mode',
  title:  'Colors',
  contexts: ['all'],
})

color_options.forEach(option => {
  chrome.contextMenus.create({
    id:       option,
    parentId: 'color-mode',
    title:    ' '+option,
    checked:  false,
    type:     'radio',
    contexts: ['all'],
  })
})

chrome.contextMenus.onClicked.addListener(({parentMenuItemId, menuItemId}, tab) => {
  if (parentMenuItemId !== 'color-mode') return

  chrome.storage.sync.set({[storagekey]: menuItemId})
  sendColorMode(menuItemId)
})