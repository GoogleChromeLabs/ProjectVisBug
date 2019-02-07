import $ from 'blingblingjs'
import hotkeys from 'hotkeys-js'
import { PluginRegistry, PluginHints } from '../plugins/_registry'

let SelectorEngine

// create input
const search_base = document.createElement('div')
search_base.classList.add('search')
search_base.innerHTML = `
  <input list="visbug-plugins" type="text" placeholder="ex: images, .btn, button, text, ..."/>
  <datalist id="visbug-plugins">
    ${PluginHints.reduce((options, command) => 
      options += `<option value="${command}">plugin</option>`
    , '')}
    <option value="h1, h2, h3, .get-multiple">example</option>
    <option value="nav > a:first-child">example</option>
    <option value="#get-by-id">example</option>
    <option value=".get-by.class-names">example</option>
    <option value="images">alias</option>
    <option value="text">alias</option>
  </datalist>
`

const search        = $(search_base)
const searchInput   = $('input', search_base)

const showSearchBar = () => search.attr('style', 'display:block')
const hideSearchBar = () => search.attr('style', 'display:none')
const stopBubbling  = e => e.key != 'Escape' && e.stopPropagation()

export function Search(node) {
  if (node) node[0].appendChild(search[0])

  const onQuery = e => {
    e.preventDefault()
    e.stopPropagation()

    const query = e.target.value

    window.requestIdleCallback(_ =>
      queryPage(query))
  }

  searchInput.on('input', onQuery)
  searchInput.on('keydown', stopBubbling)
  // searchInput.on('blur', hideSearchBar)

  showSearchBar()
  searchInput[0].focus()

  // hotkeys('escape,esc', (e, handler) => {
  //   hideSearchBar()
  //   hotkeys.unbind('escape,esc')
  // })

  return () => {
    hideSearchBar()
    searchInput.off('oninput', onQuery)
    searchInput.off('keydown', stopBubbling)
    searchInput.off('blur', hideSearchBar)
  }
}

export function provideSelectorEngine(Engine) {
  SelectorEngine = Engine
}

export function queryPage(query, fn) {
  // todo: should stash a cleanup method to be called when query doesnt match
  if (PluginRegistry.has(query)) 
    return PluginRegistry.get(query)(query)

  if (query == 'links')     query = 'a'
  if (query == 'buttons')   query = 'button'
  if (query == 'images')    query = 'img'
  if (query == 'text')      query = 'p,caption,a,h1,h2,h3,h4,h5,h6,small,date,time,li,dt,dd'

  if (!query) return SelectorEngine.unselect_all()
  if (query == '.' || query == '#' || query.trim().endsWith(',')) return

  try {
    let matches = $(query + ':not(tool-pallete):not(script):not(hotkey-map):not(.visbug-metatip):not(visbug-label):not(visbug-handles)')
    if (!matches.length) matches = $(query)
    if (!fn) SelectorEngine.unselect_all()
    if (matches.length)
      matches.forEach(el =>
        fn
          ? fn(el)
          : SelectorEngine.select(el))
  }
  catch (err) {}
}
