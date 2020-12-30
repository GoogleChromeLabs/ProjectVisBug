const viewmodestoragekey = 'visbug-view-mode'
const defaultviewmode = 'Document'

const view_options = [
  'Document',
  'Artboard',
]

const viewmodestate = {
  mode: defaultviewmode
}

const sendViewMode = () => {
  chrome.tabs.query({active: true, currentWindow: true}, ([tab]) => {
    tab && chrome.tabs.sendMessage(tab.id, {
      action: 'VIEW_MODE',
      params: {mode:viewmodestate.mode},
    })
  })
}

const getViewMode = () => {
  chrome.storage.sync.get([viewmodestoragekey], value => {
    let found_value = value[viewmodestoragekey]

    const is_default = found_value
      ? value[viewmodestoragekey] === defaultviewmode
      : false

    // first run
    if (!found_value && !is_default) {
      found_value = defaultviewmode
      chrome.storage.sync.set({[viewmodestoragekey]: defaultviewmode})
    }

    // update checked state of view contextmenu radio list
    view_options.forEach(option => {
      chrome.contextMenus.update(option, {
        checked: option === found_value
      })
    })

    // send visbug user preference
    viewmodestate.mode = found_value
    sendViewMode()

    return found_value
  })
}

// load synced view choice on load
getViewMode()

chrome.contextMenus.create({
  id:     'view-mode',
  title:  'View Mode',
  contexts: ['all'],
})

view_options.forEach(option => {
  chrome.contextMenus.create({
    id:       option,
    parentId: 'view-mode',
    title:    ' '+option,
    checked:  false,
    type:     'radio',
    contexts: ['all'],
  })
})

chrome.contextMenus.onClicked.addListener(({parentMenuItemId, menuItemId}, tab) => {
  if (parentMenuItemId !== 'view-mode') return

  chrome.storage.sync.set({[viewmodestoragekey]: menuItemId})
  viewmodestate.mode = menuItemId

  sendViewMode()
})
