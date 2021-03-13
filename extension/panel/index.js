// init panels
chrome.devtools.panels.create('Design', null, 'panel/panel.html', design_panel => {
  // design_panel.onShown.addListener(e =>
  //   post({action: 'show-toolbar'}))
})

chrome.devtools.panels.elements.createSidebarPane('VisBug', sidebar => {
  sidebar.setPage('../pane/visbug/index.html')
  sidebar.setHeight('8ex')
})

chrome.devtools.panels.elements.createSidebarPane('Style Guide', sidebar => {
  sidebar.setPage('../pane/styleguide/index.html')
  sidebar.setHeight('8ex')
})

chrome.devtools.panels.elements.createSidebarPane('Sizing', sidebar => {
  sidebar.setPage('../pane/sizing/index.html')
  sidebar.setHeight('8ex')
})