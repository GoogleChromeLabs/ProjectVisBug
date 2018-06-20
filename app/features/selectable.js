import { $$, $ } from 'blingblingjs'

export function Selectable(selector) {
  const elements      = $$(selector)
  let some_selected   = false

  elements.on('click', ({target, shiftKey}) => {
    if (!shiftKey) unselect_all()
    target.setAttribute('data-selected', true)
    some_selected = true
  })

  $('body').on('click', ({target}) => {
    let matches = elements.filter(el => el == target)
    if (some_selected && !matches.length)
      unselect_all()
  })

  const unselect_all = () => {
    elements
      .filter(el => el.hasAttribute('data-selected'))
      .forEach(el => el.removeAttribute('data-selected'))

    some_selected = false
  }
}