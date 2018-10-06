const pallete = document.createElement('tool-pallete')
document.body.prepend(pallete)

chrome.runtime.onMessage.addListener(({ action, params }, sender, sendResponse) => {
  pallete[action](params)
})