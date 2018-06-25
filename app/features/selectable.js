import { $$, $ } from 'blingblingjs'
// todo: consider making this a singleton with callbacks for element interaction events
export function Selectable(elements) {
  let selected = []
  let selectedCallbacks = []

  // todo: right click "expand selection"
  // todo: direct and group select distinguishing
    // - groups have box shadows, .container/.nav/.card, section/article/main/header/nav

  elements.on('click', e => {
    if (!e.shiftKey) unselect_all()
    e.target.setAttribute('data-selected', true)
    selected.push(e.target)
    emitSelected()
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
    // todo: better ignoring of tool pallete clicks (why isnt stop propogation in tool palette working?)
    if (
        target.nodeName == 'BODY' 
        || (
          !selected.filter(el => el == target).length 
          && (target.parentElement && target.parentElement.parentElement && target.parentElement.parentElement.nodeName != 'TOOL-PALLETE')
        )
      )
      unselect_all()
    emitSelected()
  })

  const unselect_all = () => {
    selected
      .forEach(el => 
        el.removeAttribute('data-selected'))

    selected = []
  }

  const onSelectedUpdate = cb =>
    selectedCallbacks.push(cb) && cb(selected)

  const removeSelectedCallback = cb =>
    selectedCallbacks = selectedCallbacks.filter(callback => callback != cb)

  const emitSelected = () =>
    selectedCallbacks.forEach(cb => cb(selected))

  return {
    onSelectedUpdate,
    removeSelectedCallback,
  }
}