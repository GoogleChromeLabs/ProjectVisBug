import {gimmeToggle} from "./contextmenu/launcher.js"
import {getColorMode} from "./contextmenu/colormode.js"
import {getColorScheme} from "./contextmenu/colorscheme.js"

const state = {
  loaded:   {},
  injected: {},
}

var platform = typeof browser === 'undefined'
  ? chrome
  : browser

const toggleIn = ({id:tab_id}) => {
  // toggle out: it's currently loaded and injected
  if (state.loaded[tab_id] && state.injected[tab_id]) {
    platform.scripting.executeScript({
      target: {tabId: tab_id},
      files: ['toolbar/eject.js'],
    })
    state.injected[tab_id] = false
  }

  // toggle in: it's loaded and needs injected
  else if (state.loaded[tab_id] && !state.injected[tab_id]) {
    platform.scripting.executeScript({
      target: {tabId: tab_id},
      files: ['toolbar/restore.js'],
    })
    state.injected[tab_id] = true
    getColorMode()
    getColorScheme()
  }

  // fresh start in tab
  else {
    platform.scripting.insertCSS({
      target: {tabId: tab_id},
      files: ['toolbar/bundle.css' ],
    })
    platform.scripting.executeScript({
      target: {tabId: tab_id},
      files: ['toolbar/inject.js'],
    })

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

gimmeToggle(toggleIn)
