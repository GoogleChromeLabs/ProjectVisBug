var platform = typeof browser === 'undefined'
  ? chrome
  : browser

var restore = () => {
  const visbug = document.createElement('vis-bug')
  const src_path = platform.runtime.getURL(`tuts/guides.gif`)

  visbug.setAttribute('tutsBaseURL', src_path.slice(0, src_path.lastIndexOf('/')))
  document.body.prepend(visbug)
}

restore()
