import $ from 'blingblingjs'
import hotkeys from 'hotkeys-js'

// create input
const search_base = document.createElement('div')
search_base.classList.add('search')
search_base.innerHTML = `<input type="text"/>`

const search        = $(search_base)
const searchInput   = $('input', search_base)

const showSearchBar = () => search.attr('style', 'display:block')
const hideSearchBar = () => search.attr('style', 'display:none')
const stopBubbling  = e => e.key != 'Escape' && e.stopPropagation()

export function Search(SelectorEngine, node) {
  if (node) node[0].appendChild(search[0])

  const onQuery = e => {
    e.preventDefault()
    e.stopPropagation()

    let query = e.target.value

    if (query == 'links') query = 'a'
    if (query == 'buttons') query = 'button'
    if (query == 'images') query = 'img'
    if (query == 'text') query = 'p,caption,a,h1,h2,h3,h4,h5,h6,small,date,time,li,dt,dd'

    if (!query) return SelectorEngine.unselect_all()
    if (query == '.' || query == '#') return

    try {
      const matches = $(query)
      SelectorEngine.unselect_all()
      if (matches.length)
        matches.forEach(el =>
          SelectorEngine.select(el))
    }
    catch (err) {}
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