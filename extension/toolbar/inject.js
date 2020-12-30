var platform = typeof browser === 'undefined'
  ? chrome
  : browser

const script = document.createElement('script')
script.src = platform.runtime.getURL('toolbar/bundle.min.js')
document.body.appendChild(script)

const visbug = document.createElement('vis-bug')

const src_path = platform.runtime.getURL(`tuts/guides.gif`)
visbug.setAttribute('tutsBaseURL', src_path.slice(0, src_path.lastIndexOf('/')))

document.firstElementChild.append(visbug)

platform.runtime.onMessage.addListener(request => {
  if (request.action === 'COLOR_MODE')
   visbug.setAttribute('color-mode', request.params.mode)
})
