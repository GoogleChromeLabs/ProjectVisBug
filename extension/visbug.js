const state = {
  loaded:   {},
  injected: {},
}

var platform = typeof browser === 'undefined'
  ? chrome
  : browser

var commands = platform.commands.getAll(cmds => {
  var [cmd] = cmds
  if (!cmd) return

  platform.browserAction.setTitle({
    title: `Click or press ${cmd.shortcut} to launch VisBug`,
  })
})

const toggleIn = ({id:tab_id}) => {
  // toggle out: it's currently loaded and injected
  if (state.loaded[tab_id] && state.injected[tab_id]) {
    platform.tabs.executeScript(tab_id, { file: 'toolbar/eject.js' })
    state.injected[tab_id] = false
  }

  // toggle in: it's loaded and needs injected
  else if (state.loaded[tab_id] && !state.injected[tab_id]) {
    platform.tabs.executeScript(tab_id, { file: 'toolbar/restore.js' })
    state.injected[tab_id] = true
    getColorMode()
    getColorScheme()
  }

  // fresh start in tab
  else {
    platform.tabs.insertCSS(tab_id,     { file: 'toolbar/bundle.css' })
    platform.tabs.executeScript(tab_id, { file: 'toolbar/inject.js' })

    state.loaded[tab_id]    = true
    state.injected[tab_id]  = true
    getColorMode()
    getColorScheme()
  }

  platform.tabs.onUpdated.addListener(function(tabId) {
    if (tabId === tab_id)
      state.loaded[tabId] = false
  })
}
