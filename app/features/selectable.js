import $ from 'blingblingjs'
import hotkeys from 'hotkeys-js'

import { EditText } from './text'
import { canMoveLeft, canMoveRight, canMoveUp } from './move'
import { watchImagesForUpload } from './imageswap'
import { htmlStringToDom } from './utils'

// todo: alignment guides
export function Selectable() {
  const elements          = $('body')
  let selected            = []
  let selectedCallbacks   = []

  watchImagesForUpload()

  elements.on('click', e => {
    if (isOffBounds(e.target) && !selected.filter(el => el == e.target).length) 
      return

    e.preventDefault()
    e.stopPropagation()
    if (!e.shiftKey) unselect_all()
    select(e.target)
  })

  elements.on('dblclick', e => {
    e.preventDefault()
    e.stopPropagation()
    if (isOffBounds(e.target)) return
    EditText([e.target], {focus:true})
    $('tool-pallete')[0].toolSelected('text')
  })

  hotkeys('esc', _ => 
    selected.length && unselect_all())

  hotkeys('cmd+d', e => {
    const root_node = selected[0]
    if (!root_node) return

    const deep_clone = root_node.cloneNode(true)
    deep_clone.removeAttribute('data-selected')
    root_node.parentNode.insertBefore(deep_clone, root_node.nextSibling)
    e.preventDefault()
  })

  hotkeys('backspace,del,delete', e => 
    selected.length && delete_all())

  hotkeys('alt+del,alt+backspace', e =>
    selected.forEach(el =>
      el.attr('style', null)))

  document.addEventListener('copy', e => {
    if (selected[0] && this.node_clipboard !== selected[0]) {
      let $node = selected.slice(0,1)[0]
      $node.removeAttribute('data-selected')
      this.copy_backup = $node.outerHTML
      e.clipboardData.setData('text/html', this.copy_backup)
    }
  })

  document.addEventListener('cut', e => {
    if (selected[0] && this.node_clipboard !== selected[0]) {
      let $node = selected.slice(0,1)[0]
      $node.removeAttribute('data-selected')
      this.copy_backup = $node.outerHTML
      e.clipboardData.setData('text/html', this.copy_backup)
      selected[0].remove()
    }
  })

  document.addEventListener('paste', e => {
    const potentialHTML = e.clipboardData.getData('text/html') || this.copy_backup
    if (selected[0] && potentialHTML) {
      e.preventDefault()
      selected[0].appendChild(
        htmlStringToDom(potentialHTML))
    }
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

  hotkeys('cmd+g,cmd+shift+g', (e, {key}) => {
    e.preventDefault()

    if (key.split('+').includes('shift')) {
      let $selected = [...selected]
      unselect_all()
      $selected.reverse().forEach(el => {
        let l = el.children.length
        while (el.children.length > 0) {
          var node = el.childNodes[el.children.length - 1]
          if (node.nodeName !== '#text')
            select(node)
          el.parentNode.prepend(node)
        }
        el.parentNode.removeChild(el)
      })
    }
    else {
      let div = document.createElement('div')
      selected[0].parentNode.prepend(
        selected.reverse().reduce((div, el) => {
          div.appendChild(el)
          return div
        }, div)
      )
      unselect_all()
      select(div)
    }
  })

  elements.on('selectstart', e =>
    !isOffBounds(e.target) 
    && selected.length 
    && selected[0].textContent != e.target.textContent 
    && e.preventDefault())

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

  elements.on('mouseover', ({target}) =>
    !isOffBounds(target) && target.setAttribute('data-hover', true))

  elements.on('mouseout', ({target}) =>
    target.removeAttribute('data-hover'))

  const select = el => {
    if (el.nodeName === 'svg' || el.ownerSVGElement) return

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

  const delete_all = () => {
    selected.forEach(el =>
      el.remove())
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

  const isOffBounds = node =>
    node.closest && (node.closest('tool-pallete') || node.closest('.metatip') || node.closest('hotkey-map'))

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