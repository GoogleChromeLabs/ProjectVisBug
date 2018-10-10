import Channel from '../utils/channel.js'

const channel_name = 'design-panel'
const Pipe = new Channel({
  name: channel_name,
  model: {
    tabId:          chrome.devtools.inspectedWindow.tabId,
    src_channel:    channel_name,
    target_channel: 'design-artboard',
  }
})

document.body.classList.add(
  chrome.devtools.panels.themeName)

Pipe.port.onMessage.addListener((message, sender) => {
  console.log(`${channel_name} recieved port message`, message, sender)
  
  if (message.action == 'selected')
    render_layers(message.payload)
})

Pipe.message.onMessage.addListener((request, sender, sendResponse) => {
  console.log(`${channel_name} onMessage`, request)
})

// todo: render node props then children 
const recurse_nodes = ({nodeName, className, id, children}) => `
  <details>
    <summary class="layer">
      <span icon></span>
      ${nodeName}${id ? '#' + id : ''} ${className}
    </summary>
    <ol>
      ${children.map(node =>
        node.children.length
          ? `<li>${recurse_nodes(node)}</li>`
          : `
              <li>
                <span class="layer">
                  <span icon></span>
                  ${node.nodeName}${node.id ? '#' + node.id : ''} ${node.className}
                </span>
              </li>
            `
      ).join('')}
    </ol>
  </details>
`

const render_layers = nodes => {
  console.log('show in dom', nodes)
  document.getElementById('layers').innerHTML = nodes.map(recurse_nodes).join('')
}