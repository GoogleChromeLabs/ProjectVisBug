var platform = typeof browser === 'undefined'
  ? chrome
  : browser

var toggleIt

export const gimmeToggle = toggleIn => {
  toggleIt = toggleIn
  platform.action.onClicked.addListener(toggleIt)
}

platform.contextMenus.create({
  id:     'launcher',
  title:  'Show/Hide',
  contexts: ['all'],
})

// Cria o item do menu de contexto "Colar link"
platform.contextMenus.create({
  id: 'pasteLink',
  title: 'Colar link',
  contexts: ['all'],
});

platform.contextMenus.onClicked.addListener(async ({ menuItemId }, tab) => {
  if (menuItemId === 'launcher') {
    toggleIt(tab);
  } else if (menuItemId === 'pasteLink') {
    console.log('Paste link menu item clicked');
    // Executa a lógica de colar link no elemento selecionado
    const [activeTab] = await platform.tabs.query({ active: true, currentWindow: true });
    console.log('Active tab:', activeTab);

    platform.scripting.executeScript({
      target: { tabId: activeTab.id },
      func: async () => {
        console.log('Executing script in tab');
        const text = await navigator.clipboard.readText();
        console.log('Clipboard text:', text);

        let selectedElement = document.activeElement;
        console.log('Selected element:', selectedElement);

        if (selectedElement && selectedElement.tagName === 'A') {
          selectedElement.href = text;
          alert('Link atualizado para: ' + text);
        } else {
          alert('O elemento selecionado não é um link ou nenhum elemento está selecionado.');
        }
      },
    }).catch((error) => {
      console.error('Error executing script:', error);
    });
  }
});