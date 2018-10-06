document.body.prepend(document.createElement('tool-pallete'))

chrome.runtime.onMessage.addListener(({ action, params }, sender, sendResponse) => {
  const [pallete] = document.getElementsByTagName('tool-pallete')
  pallete && pallete[action](params)
})