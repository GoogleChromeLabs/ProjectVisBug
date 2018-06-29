import { $$, $ } from 'blingblingjs'
import { EditText } from './text'

export function Selectable(elements) {
  let selected = []
  let selectedCallbacks = []

  // todo: right click "expand selection"
  // todo: alignment guides
  // todo: click/hover is highest level match, cmd+click/cmd+hover is lowest level
  // todo: keyboard selection navigation
    // tab/shift+tab move selection to next or prev el (single selected only?)
    // enter/esc move up and down

  elements.on('click', e => {
    if (!e.shiftKey) unselect_all()
    e.target.setAttribute('data-selected', true)
    selected.push(e.target)
    tellWatchers()
    e.preventDefault()
    e.stopPropagation()
  })

  elements.on('dblclick', e => {
    EditText([e.target])
    $('tool-pallete').toolSelected($('li[data-tool="text"]'))
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
    tellWatchers()
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

  const tellWatchers = () =>
    selectedCallbacks.forEach(cb => cb(selected))

  return {
    onSelectedUpdate,
    removeSelectedCallback,
  }
}