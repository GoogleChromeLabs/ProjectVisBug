var platform = typeof browser === 'undefined'
  ? chrome
  : browser

platform.browserAction.onClicked.addListener(toggleIn)

platform.contextMenus.create({
  id:     'launcher',
  title:  'Show/Hide',
  contexts: ['all'],
})

platform.contextMenus.onClicked.addListener(({menuItemId}, tab) => {
  if (menuItemId === 'launcher')
    toggleIn(tab)
})
