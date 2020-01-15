const script = document.createElement('script')
script.src = chrome.runtime.getURL('toolbar/bundle.min.js')
document.body.appendChild(script)

const visbug = document.createElement('vis-bug')
const src_path = chrome.runtime.getURL(`tuts/guides.gif`)

visbug.tutsBaseURL = src_path.slice(0, src_path.lastIndexOf('/'))

document.body.prepend(visbug)

chrome.runtime.onMessage.addListener(request => {
  if (request.action === 'COLOR_MODE')
    visbug.colorMode = request.params.mode
})
