const metaKey = window.navigator.platform.includes('Mac')
  ? 'cmd'
  : 'ctrl'

document.firstElementChild.prepend(document.querySelector('vis-bug'))

if ('ontouchstart' in document.documentElement)
  document.getElementById('mobile-info').style.display = ''

if (metaKey === 'ctrl')
  [...document.querySelectorAll('kbd')]
    .forEach(node => {
      node.textContent = node.textContent.replace('cmd','ctrl')
      node.textContent = node.textContent.replace('opt','alt')
    })