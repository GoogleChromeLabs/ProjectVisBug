const schemestoragekey = 'visbug-color-scheme';
const defaultcolorscheme = 'auto';

const scheme_option = [
  'auto',
  'light',
  'dark',
]

const colorschemestate = {
  mode: defaultcolorscheme
}

var platform = typeof browser === 'undefined'
  ? chrome
  : browser

const sendColorScheme = () => {
  platform.tabs.query({active: true, currentWindow: true}, ([tab]) => {
    tab && platform.tabs.sendMessage(tab.id, {
      action: 'COLOR_SCHEME',
      params: {mode:colorschemestate.mode},
    })
  })
}

const getColorScheme = () => {
  platform.storage.sync.get([schemestoragekey], value => {
    let found_value = value[schemestoragekey];

    // first run
    if (!found_value) {
      found_value = defaultcolorscheme;
      platform.storage.sync.set({ [schemestoragekey]: defaultcolorscheme });
    }

    // update checked state of scheme contextmenu radio list
    scheme_option.forEach(option => {
      platform.contextMenus.update(option, {
        checked: option === found_value
      })
    })

    // send visbug user preference
    colorschemestate.mode = found_value
    sendColorScheme()

    return found_value
  })
}

// load synced scheme choice on load
getColorScheme()

platform.contextMenus.create({
  id:     'color-scheme',
  title:  'Theme',
  contexts: ['all'],
})

scheme_option.forEach(option => {
  platform.contextMenus.create({
    id:       option,
    parentId: 'color-scheme',
    title:    ' '+option,
    checked:  false,
    type:     'radio',
    contexts: ['all'],
  })
})

platform.contextMenus.onClicked.addListener(({parentMenuItemId, menuItemId}, tab) => {
  if (parentMenuItemId !== 'color-scheme') return

  platform.storage.sync.set({[schemestoragekey]: menuItemId})
  colorschemestate.mode = menuItemId

  sendColorScheme()
})
