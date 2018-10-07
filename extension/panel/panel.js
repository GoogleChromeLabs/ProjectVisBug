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
  
  if (message.action == 'selected')
    render_layers(message.payload)
})

Pipe.message.onMessage.addListener((request, sender, sendResponse) => {
  console.log(`${channel_name} onMessage`, request)
})

const render_layers = node => {
  console.log('show in dom', node)
}