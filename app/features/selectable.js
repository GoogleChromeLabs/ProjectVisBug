import $ from 'blingblingjs'
import hotkeys from 'hotkeys-js'

import { EditText } from './text'
import { canMoveLeft, canMoveRight, canMoveUp } from './move'
import { watchImagesForUpload } from './imageswap'

// todo: "expand selection"
// todo: alignment guides
export function Selectable(elements) {
  let selected = []
  let selectedCallbacks = []

  watchImagesForUpload()

  elements.on('click', e => {
    if (!e.shiftKey) unselect_all()
    select(e.target)
    e.preventDefault()
    e.stopPropagation()
  })

  elements.on('dblclick', e => {
    EditText([e.target], {focus:true})
    $('tool-pallete')[0].toolSelected($('li[data-tool="text"]')[0])
    e.preventDefault()
    e.stopPropagation()
  })

  hotkeys('esc', _ => 
    selected.length && unselect_all())

  hotkeys('cmd+d', e => {
    const root_node = selected[0]
    if (!root_node) return

    const deep_clone = root_node.cloneNode(true)
    selected.push(deep_clone)
    root_node.parentNode.insertBefore(deep_clone, root_node.nextSibling)
    e.preventDefault()
  })

  hotkeys('cmd+e,cmd+shift+e', (e, {key}) => {
    e.preventDefault()

    // TODO: need a much smarter system here
    // only expands base tag names atm
    if (selected[0].nodeName !== 'DIV')
      expandSelection({
        root_node: selected[0], 
        all: key.includes('shift'),
      })
  })

  elements.on('selectstart', e =>
    selected.length && selected[0].textContent != e.target.textContent && e.preventDefault())

  hotkeys('tab,shift+tab,enter,shift+enter', (e, {key}) => {
    if (selected.length !== 1) return

    e.preventDefault()
    e.stopPropagation()

    const current = selected[0]

    if (key.includes('shift')) {
      if (key.includes('tab') && canMoveLeft(current)) {
        unselect_all()
        select(canMoveLeft(current))
      }
      if (key.includes('enter') && canMoveUp(current)) {
        unselect_all()
        select(current.parentNode)
      }
    }
    else {
      if (key.includes('tab') && canMoveRight(current)) {
        unselect_all()
        select(canMoveRight(current))
      }
      if (key.includes('enter') && current.children.length) {
        unselect_all()
        select(current.children[0])
      }
    }
  })

  // todo: while hovering; display name/type of node on element
  elements.on('mouseover', ({target}) =>
    target.setAttribute('data-hover', true))

  elements.on('mouseout', ({target}) =>
    target.removeAttribute('data-hover'))

  $('body').on('click', ({target}) => {
    if (target.nodeName == 'BODY'  || (
        !selected.filter(el => el == target).length 
        && !target.closest('tool-pallete')
      )
    ) unselect_all()
    tellWatchers()
  })

  const select = el => {
    el.setAttribute('data-selected', true)
    selected.unshift(el)
    tellWatchers()
  }

  const unselect_all = () => {
    selected
      .forEach(el => 
        $(el).attr({
          'data-selected': null,
          'data-selected-hide': null,
        }))

    selected = []
  }

  const expandSelection = ({root_node, all}) => {
    if (all) {
      const unselecteds = $(root_node.nodeName.toLowerCase() + ':not([data-selected])')
      unselecteds.forEach(select)
    }
    else {
      const potentials = $(root_node.nodeName.toLowerCase())
      if (!potentials) return

      const root_node_index = potentials.reduce((index, node, i) =>
        node == root_node 
          ? index = i
          : index
      , null)

      if (root_node_index !== null) {
        if (!potentials[root_node_index + 1]) {
          const potential = potentials.filter(el => !el.attr('data-selected'))[0]
          if (potential) select(potential)
        }
        else {
          select(potentials[root_node_index + 1])
        }
      }
    }
  }

  const onSelectedUpdate = cb =>
    selectedCallbacks.push(cb) && cb(selected)

  const removeSelectedCallback = cb =>
    selectedCallbacks = selectedCallbacks.filter(callback => callback != cb)

  const tellWatchers = () =>
    selectedCallbacks.forEach(cb => cb(selected))

  return {
    select,
    unselect_all,
    onSelectedUpdate,
    removeSelectedCallback,
  }
}