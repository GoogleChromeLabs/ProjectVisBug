import ToolPallete from './components/tool-pallete/toolpallete.element'
import { metaKey } from './utilities'

if ('ontouchstart' in document.documentElement)
  document.getElementById('mobile-info').style.display = ''

if (metaKey === 'ctrl')
  [...document.querySelectorAll('kbd')]
    .filter(node => node.textContent.includes('cmd'))
    .forEach(node => node.textContent = node.textContent.replace('cmd','ctrl'))
