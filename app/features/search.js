import $ from 'blingblingjs'
import hotkeys from 'hotkeys-js'
import { querySelectorAllDeep } from 'query-selector-shadow-dom'
import { PluginRegistry, PluginHints } from '../plugins/_registry'
import { notList } from '../utilities'
import { isFirefox } from '../utilities/cross-browser.js'

let SelectorEngine

// create input
const search_base = document.createElement('div')
search_base.classList.add('search')
search_base.innerHTML = `
  <input list="visbug-plugins" type="search" placeholder="ex: images, .btn, button, text, ..."/>
  <datalist id="visbug-plugins">
    ${isFirefox > 0
      ?  `<option value="h1, h2, h3, .get-multiple">
          <option value="nav > a:first-child">
          <option value="#get-by-id">
          <option value=".get-by.class-names">
          <option value="images">
          <option value="text">
          <hr>`

      :  `<option value="h1, h2, h3, .get-multiple">example</option>
          <option value="nav > a:first-child">example</option>
          <option value="#get-by-id">example</option>
          <option value=".get-by.class-names">example</option>
          <option value="images">alias</option>
          <option value="text">alias</option>
          <hr>`}

    ${PluginHints.reduce((options, hint) =>
      options += isFirefox > 0
        ? `<option value="${hint.command}">`
        : `<option value="${hint.command}">${hint.description}`
    , '')}
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

  const focus = e =>
    searchInput[0].focus()

  searchInput.on('click', focus)
  searchInput.on('input', onQuery)
  searchInput.on('keydown', stopBubbling)
  // searchInput.on('blur', hideSearchBar)

  showSearchBar()
  focus()

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
    return PluginRegistry.get(query)({
      selected: SelectorEngine.selection(),
      query
    })

  if (query == 'links')     query = 'a'
  if (query == 'buttons')   query = 'button'
  if (query == 'images')    query = 'img'
  if (query == 'text')      query = 'p,caption,a,h1,h2,h3,h4,h5,h6,small,date,time,li,dt,dd'

  if (!query) return SelectorEngine.unselect_all()
  if (query == '.' || query == '#' || query.trim().endsWith(',')) return

  try {
    let matches = querySelectorAllDeep(query + notList)
    if (!matches.length) matches = querySelectorAllDeep(query)
    if (matches.length) {
      matches.forEach(el =>
        fn
          ? fn(el)
          : SelectorEngine.select(el))
    }
  }
  catch (err) {}
}
