import $ from 'blingblingjs'

const dialog = $('#node-search')
const searchInput = $('input', dialog[0])

export function Search(SelectorEngine) {
  const onQuery = e => {
    const query = e.target.value

    if (!query) return SelectorEngine.unselect_all()
    if (query == '.' || query == '#') return

    try {
      const matches = $(query)
      if (matches.length) {
        SelectorEngine.unselect_all()
        matches.forEach(el =>
          SelectorEngine.select(el))
      }
    }
    catch (err) {}
  }

  const showSearchBar = () => dialog.attr('open', '')
  const hideSearchBar = () => dialog.attr('open', null)

  searchInput.on('input', onQuery)
  searchInput.on('blur', hideSearchBar)

  showSearchBar()
  searchInput[0].focus()

  return () => {
    hideSearchBar()
    searchInput.off('oninput', onQuery)
    searchInput.off('blur', hideSearchBar)
  }
}