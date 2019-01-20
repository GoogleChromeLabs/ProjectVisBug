import $ from 'blingblingjs'
import hotkeys from 'hotkeys-js'

let SelectorEngine

// create input
const search_base = document.createElement('div')
search_base.classList.add('search')
search_base.innerHTML = `<input type="text" placeholder="ex: images, .btn, button, text, ..."/>`

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

  showSearchBar()
  searchInput[0].focus()

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
  if (query == 'links')     query = 'a'
  if (query == 'buttons')   query = 'button'
  if (query == 'images')    query = 'img'
  if (query == 'text')      query = 'p,caption,a,h1,h2,h3,h4,h5,h6,small,date,time,li,dt,dd'

  if (!query) return SelectorEngine.unselect_all()
  if (query == '.' || query == '#' || query.trim().endsWith(',')) return

  try {
    let matches = $(query + ':not(tool-pallete):not(script):not(hotkey-map):not(.pb-metatip):not(pb-label):not(pb-handles)')
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