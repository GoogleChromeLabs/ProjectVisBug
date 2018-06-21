import { $$, $ } from 'blingblingjs'

export function Selectable(elements) {
  let some_selected = false

  elements.on('click', ({target, shiftKey}) => {
    if (!shiftKey) unselect_all()
    target.setAttribute('data-selected', true)
    some_selected = true
  })

  elements.on('mouseenter', ({target}) =>
    target.setAttribute('data-hover', true))
  elements.on('mouseleave', ({target}) =>
    target.removeAttribute('data-hover'))

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

  return () => hotkeys.unbind('up,down,left,right')
}