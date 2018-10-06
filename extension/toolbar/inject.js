document.body.prepend(document.createElement('hotkey-map'))
document.body.prepend(document.createElement('tool-pallete'))

chrome.runtime.sendMessage({pixel: "bug"})

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log(sender.tab 
    ? "from a content script:" + sender.tab.url 
    : "from the extension")
})