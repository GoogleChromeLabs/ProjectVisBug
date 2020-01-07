chrome.browserAction.onClicked.addListener(toggleIn)

chrome.contextMenus.create({
  id:     'launcher',
  title:  'Show/Hide',
  contexts: ['all'],
})

chrome.contextMenus.onClicked.addListener(({menuItemId}, tab) => {
  if (menuItemId === 'launcher')
    toggleIn(tab)
})
