chrome.devtools.panels.create('Design', null, 'panel/panel.html', design_panel => {
  console.info(chrome.devtools.panels.themeName)
})

chrome.devtools.panels.elements.createSidebarPane("PixelBug", sidebar => {
  sidebar.setPage("../pane/pixelbug/index.html");
  sidebar.setHeight("8ex");
})

chrome.devtools.panels.elements.createSidebarPane("Style Guide", sidebar => {
  sidebar.setPage("../pane/styleguide/index.html");
  sidebar.setHeight("8ex");
})

chrome.devtools.panels.elements.createSidebarPane("Sizing", sidebar => {
  sidebar.setPage("../pane/sizing/index.html");
  sidebar.setHeight("8ex");
})