const channel = 'design-panel'
const port    = chrome.runtime.connect({ name: channel })

const payload_model = {
  tabId:          chrome.devtools.inspectedWindow.tabId,
  src_channel:    channel,
  target_channel: 'design-artboard',
}

const post = payload =>
  port.postMessage(
    Object.assign(payload_model, {
      data: payload,
    }))

const message = payload =>
  chrome.runtime.sendMessage(
    Object.assign(payload_model, {
      data: payload,
    }))

port.onMessage.addListener((message, sender) => {
  console.log(`${channel} recieved port message`, message, sender)
})

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log(`${channel} onMessage`, request)
})

post({action: 'register'})
// post({pixel: 'bug'})
// message({pixel: 'bug'})





// init panels
chrome.devtools.panels.create('Design', null, 'panel/panel.html', design_panel => {
  console.info(chrome.devtools.panels.themeName)

  design_panel.onShown.addListener(e =>
    post({action: 'show-toolbar'}))
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