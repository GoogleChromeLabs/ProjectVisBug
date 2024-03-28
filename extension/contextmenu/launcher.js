var platform = typeof browser === 'undefined'
  ? chrome
  : browser

var toggleIt

export const gimmeToggle = toggleIn => {
  toggleIt = toggleIn
  platform.action.onClicked.addListener(toggleIt)
}

platform.contextMenus.create({
  id:     'launcher',
  title:  'Show/Hide',
  contexts: ['all'],
})

platform.contextMenus.onClicked.addListener(({menuItemId}, tab) => {
  if (menuItemId === 'launcher')
    toggleIt(tab)
})
