import $ from 'blingblingjs'

const dialog = $('#node-search')
const searchInput = $('input', dialog[0])

export function Search(SelectorEngine) {
  dialog.attr('open', '')

  const onQuery = e => {
    const query = e.target.value

    if (!query) return SelectorEngine.unselect_all()
    if (query == '.' || query == '#') return

    const matches = $(query)
    if (matches.length) {
      SelectorEngine.unselect_all()
      matches.forEach(el =>
        SelectorEngine.select(el))
    }
  }

  searchInput.on('input', onQuery)

  return () => {
    dialog.attr('open', null)
    searchInput.off('oninput', onQuery)
  }
}