var pallete = document.createElement('tool-pallete')
var src_path = chrome.extension.getURL(`tuts/guides.gif`)

pallete.tutsBaseURL = src_path.slice(0, src_path.lastIndexOf('/'))

document.body.prepend(pallete)
