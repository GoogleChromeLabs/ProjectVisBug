document.body.prepend(document.createElement('tool-pallete'))

chrome.runtime.onMessage.addListener(({ action, params }, sender, sendResponse) => {
  const [pallete] = document.getElementsByTagName('tool-pallete')
  pallete && pallete[action](params)
})

// port creation/messaging
let port

const setupPortIfNeeded = () => {
  if (!port) {
    port = chrome.runtime.connect(null, { name: "content" })
    port.onDisconnect.addListener(() => {
      port = null
    })
  }
}

const post = payload => {
  setupPortIfNeeded()

  port.postMessage(
    Object.assign(payload, {
      target: 'panel',
    })
  )
}

const message = payload => {
  chrome.runtime.sendMessage(
    Object.assign(payload, {
      target: 'panel',
    })
  )
}

post({action: 'init'})
message({bug: 'pixel'})

chrome.runtime.onConnect.addListener(port => {
  port.onMessage.addListener(message => {
    console.log('inject recieved port message', message)
  })
})

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("content-script: onMessage", message)
})

