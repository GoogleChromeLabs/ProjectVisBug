var pallete = document.createElement('tool-pallete')
document.body.prepend(pallete)

// port creation/messaging
const channel = 'design-artboard'
const port    = chrome.runtime.connect({ name: channel })

const payload_model = {
  src_channel:    channel,
  target_channel: 'design-panel',
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

port.onMessage.addListener(message => {
  console.log(`${channel} recieved port message`, message)
})

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log(`${channel} onMessage`, request)
  const { action, params } = request
  if (action != 'toolSelected') return
  const [pallete] = document.getElementsByTagName('tool-pallete')
  pallete && pallete[action](params)
})

post({action: 'register'})
// post({bug: 'pixel'})
// message({bug: 'pixel'})

pallete.selectorEngine.onSelectedUpdate(nodes =>
  post(nodes.map(({nodeName, id, className}) => ({
    nodeName, id, className
  }))))
