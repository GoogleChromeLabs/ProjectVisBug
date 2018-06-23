import { $$, $ } from 'blingblingjs'

export function Selectable(elements) {
  let selected = []

  // todo: prevent link and button clicks from firing behavior
  // todo: right click "expand selection"
  // todo: direct and group select distinguishing
    // - groups have box shadows, .container/.nav/.card, section/article/main/header/nav

  elements.on('click', e => {
    if (!e.shiftKey) unselect_all()
    e.target.setAttribute('data-selected', true)
    // todo: show arrows on sides?
    selected.push(e.target)
    e.preventDefault()
    e.stopPropagation()
  })

  // todo: hover moves a border element around the screen instead of changing the element being hovered
  // todo: while hovering; display name/type of node on element
  elements.on('mouseover', ({target}) =>
    target.setAttribute('data-hover', true))

  elements.on('mouseout', ({target}) =>
    target.removeAttribute('data-hover'))

  $('body').on('click', ({target}) => {
    if (!selected.filter(el => el == target).length)
      unselect_all()
  })

  const unselect_all = () => {
    selected
      .forEach(el => 
        el.removeAttribute('data-selected'))

    selected = []
  }

  return () => hotkeys.unbind('up,down,left,right')
}