import Channel from '../utils/channel.js'
const channel_name    = 'design-artboard'

var platform = typeof browser === 'undefined'
  ? chrome
  : browser

const script = document.createElement('script')
script.type = 'module'
script.src = platform.runtime.getURL('toolbar/bundle.min.js')
document.body.appendChild(script)

const visbug = document.createElement('vis-bug')

const src_path = platform.runtime.getURL(`tuts/guides.gif`)
visbug.setAttribute('tutsBaseURL', src_path.slice(0, src_path.lastIndexOf('/')))

document.body.prepend(visbug)

const Pipe = new Channel({
  name: channel_name,
  model: {
    src_channel:    channel_name,
    target_channel: 'design-panel',
  }
})

const layersFromDOM = ({nodeName, className, id, children}) => ({
  nodeName, className, id,
  children: [...children].map(layersFromDOM),
})

// append and watch toolbar selections
visbug.selectorEngine.onSelectedUpdate(nodes =>
  Pipe.post({
    action: 'selected',
    payload: nodes.map(layersFromDOM),
  }))

// watch pipe messages (they'll be auto filtered for this pipe)
Pipe.port.onMessage.addListener(message => {
  console.log(`${channel_name} recieved port message`, message)
})

Pipe.message.onMessage.addListener((request, sender, sendResponse) => {
  console.log(`${channel_name} onMessage`, request)

  const { action, params } = request

  // only respond to toolSelection atm
  if (action != 'toolSelected') return

  const [visbug] = document.getElementsByTagName('vis-bug')
  visbug && visbug[action](params)
  // todo: send for tool to select element as well
})

platform.runtime.onMessage.addListener(request => {
  if (request.action === 'COLOR_MODE')
    visbug.setAttribute('color-mode', request.params.mode)
})
