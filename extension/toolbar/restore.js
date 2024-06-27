var platform = typeof browser === 'undefined'
  ? chrome
  : browser

  // remover dados do armazenamento

// platform.storage.sync.remove(['userEmail'], function() { 
//   console.log('userEmail mode is removed');
// }
// );

var restore = () => {
  const visbug = document.createElement('vis-bug')
  const src_path = platform.runtime.getURL(`tuts/guides.gif`)

  visbug.setAttribute('tutsBaseURL', src_path.slice(0, src_path.lastIndexOf('/')))
  document.body.prepend(visbug)
}

restore()
