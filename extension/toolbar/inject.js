var visbug = document.createElement('vis-bug')
var src_path = chrome.extension.getURL(`tuts/guides.gif`)

visbug.tutsBaseURL = src_path.slice(0, src_path.lastIndexOf('/'))

document.body.prepend(visbug)
