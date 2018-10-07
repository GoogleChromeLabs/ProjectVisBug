import Channel from '../utils/channel.js'

const channel_name = 'design-panel'
const Pipe = new Channel({
  name: channel_name,
  model: {
    tabId:          chrome.devtools.inspectedWindow.tabId,
    src_channel:    channel_name,
    target_channel: 'design-artboard',
  }
})

Pipe.port.onMessage.addListener((message, sender) => {
  console.log(`${channel_name} recieved port message`, message, sender)
})

Pipe.message.onMessage.addListener((request, sender, sendResponse) => {
  console.log(`${channel_name} onMessage`, request)
})

// init panels
chrome.devtools.panels.create('Design', null, 'panel/panel.html', design_panel => {
  console.info(chrome.devtools.panels.themeName)

  // design_panel.onShown.addListener(e =>
  //   post({action: 'show-toolbar'}))
})

chrome.devtools.panels.elements.createSidebarPane('PixelBug', sidebar => {
  sidebar.setPage('../pane/pixelbug/index.html')
  sidebar.setHeight('8ex')
})

chrome.devtools.panels.elements.createSidebarPane('Style Guide', sidebar => {
  sidebar.setPage('../pane/styleguide/index.html')
  sidebar.setHeight('8ex')
})

chrome.devtools.panels.elements.createSidebarPane('Sizing', sidebar => {
  sidebar.setPage('../pane/sizing/index.html')
  sidebar.setHeight('8ex')
})