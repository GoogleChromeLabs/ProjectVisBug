const storagekey = 'visbug-color-mode'
const defaultcolormode = 'hsla'

const color_options = [
  'hsla',
  'hex',
  'rgba',
  // 'hsv',
  // 'lch',
  // 'lab',
  // 'hcl',
  // 'cmyk',
  // 'gl',
  // 'as authored',
]

const colormodestate = {
  mode: defaultcolormode
}

const sendColorMode = () => {
  chrome.tabs.query({active: true, currentWindow: true}, ([tab]) => {
    tab && chrome.tabs.sendMessage(tab.id, {
      action: 'COLOR_MODE',
      params: {mode:colormodestate.mode},
    })
  })
}

const getColorMode = () => {
  chrome.storage.sync.get([storagekey], value => {
    let found_value = value[storagekey]

    const is_default = found_value
      ? value[storagekey] === defaultcolormode
      : false

    // first run
    if (!found_value && !is_default) {
      found_value = defaultcolormode
      chrome.storage.sync.set({[storagekey]: defaultcolormode})
    }

    // update checked state of color contextmenu radio list
    color_options.forEach(option => {
      chrome.contextMenus.update(option, {
        checked: option === found_value
      })
    })

    // send visbug user preference
    colormodestate.mode = found_value
    sendColorMode()

    return found_value
  })
}

// load synced color choice on load
getColorMode()

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
  colormodestate.mode = menuItemId

  sendColorMode()
})
