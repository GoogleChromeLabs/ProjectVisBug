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
      title:    ' '+key,
      checked:  checked,
      type:     'radio',
      contexts: ['all'],
    })
})

chrome.contextMenus.onClicked.addListener(({menuItemId}, tab) => {
  chrome.tabs.query({active: true, currentWindow: true}, function([tab]) {
    tab && chrome.tabs.sendMessage(tab.id, {
      action: 'COLOR_MODE',
      params: {
        color: menuItemId
      },
    })
  })
})