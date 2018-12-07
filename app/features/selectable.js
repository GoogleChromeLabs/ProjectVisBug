import $ from 'blingblingjs'
import hotkeys from 'hotkeys-js'

import { canMoveLeft, canMoveRight, canMoveUp } from './move'
import { watchImagesForUpload } from './imageswap'
import { queryPage } from './search'
import { metaKey, htmlStringToDom, createClassname, isOffBounds, getStyles } from '../utilities/'

export function Selectable() {
  const elements          = $('body')
  let selected            = []
  let selectedCallbacks   = []
  let labels              = []
  let handles             = []

  const listen = () => {
    elements.forEach(el => el.addEventListener('click', on_click, true))
    elements.forEach(el => el.addEventListener('dblclick', on_dblclick, true))
    elements.on('selectstart', on_selection)
    elements.on('mouseover', on_hover)
    elements.on('mouseout', on_hoverout)

    document.addEventListener('copy', on_copy)
    document.addEventListener('cut', on_cut)
    document.addEventListener('paste', on_paste)

    watchCommandKey()

    hotkeys(`${metaKey}+alt+c`, on_copy_styles)
    hotkeys(`${metaKey}+alt+v`, e => on_paste_styles())
    hotkeys('esc', on_esc)
    hotkeys(`${metaKey}+d`, on_duplicate)
    hotkeys('backspace,del,delete', on_delete)
    hotkeys('alt+del,alt+backspace', on_clearstyles)
    hotkeys(`${metaKey}+e,${metaKey}+shift+e`, on_expand_selection)
    hotkeys(`${metaKey}+g,${metaKey}+shift+g`, on_group)
    hotkeys('tab,shift+tab,enter,shift+enter', on_keyboard_traversal)
  }

  const unlisten = () => {
    elements.forEach(el => el.removeEventListener('click', on_click, true))
    elements.forEach(el => el.removeEventListener('dblclick', on_dblclick, true))
    elements.off('selectstart', on_selection)
    elements.off('mouseover', on_hover)
    elements.off('mouseout', on_hoverout)

    document.removeEventListener('copy', on_copy)
    document.removeEventListener('cut', on_cut)
    document.removeEventListener('paste', on_paste)

    hotkeys.unbind(`esc,${metaKey}+d,backspace,del,delete,alt+del,alt+backspace,${metaKey}+e,${metaKey}+shift+e,${metaKey}+g,${metaKey}+shift+g,tab,shift+tab,enter,shift+enter`)
  }

  const on_click = e => {
    if (isOffBounds(e.target) && !selected.filter(el => el == e.target).length)
      return

    e.preventDefault()
    if (!e.altKey) e.stopPropagation()
    if (!e.shiftKey) unselect_all()

    if(e.shiftKey && e.target.hasAttribute('data-label-id'))
      unselect(e.target.getAttribute('data-label-id'))
    else
    select(e.target)
  }

  const unselect = id => {

    [...labels, ...handles]
      .filter(node =>
          node.getAttribute('data-label-id') === id)
        .forEach(node =>
          node.remove())

    selected.filter(node =>
      node.getAttribute('data-label-id') === id)
      .forEach(node =>
        $(node).attr({
          'data-selected':      null,
          'data-selected-hide': null,
          'data-label-id':      null,
          'data-hover': null
      }))

    selected = selected.filter(node => node.getAttribute('data-label-id') !== id)

    tellWatchers()
  }

  const on_dblclick = e => {
    e.preventDefault()
    e.stopPropagation()
    if (isOffBounds(e.target)) return
    $('tool-pallete')[0].toolSelected('text')
  }

  const watchCommandKey = e => {
    let did_hide = false

    document.onkeydown = function(e) {
      if (hotkeys.ctrl && selected.length) {
        $('pb-handles, pb-label').forEach(el =>
          el.style.display = 'none')

        did_hide = true
      }
    }

    document.onkeyup = function(e) {
      if (did_hide) {
        $('pb-handles, pb-label').forEach(el =>
          el.style.display = null)

        did_hide = false
      }
    }
  }

  const on_esc = _ =>
    selected.length && unselect_all()

  const on_duplicate = e => {
    const root_node = selected[0]
    if (!root_node) return

    const deep_clone = root_node.cloneNode(true)
    deep_clone.removeAttribute('data-selected')
    root_node.parentNode.insertBefore(deep_clone, root_node.nextSibling)
    e.preventDefault()
  }

  const on_delete = e =>
    selected.length && delete_all()

  const on_clearstyles = e =>
    selected.forEach(el =>
      el.attr('style', null))

  const on_copy = e => {
    // if user has selected text, dont try to copy an element
    if (window.getSelection().toString().length)
      return

    if (selected[0] && this.node_clipboard !== selected[0]) {
      e.preventDefault()
      let $node = selected[0].cloneNode(true)
      $node.removeAttribute('data-selected')
      this.copy_backup = $node.outerHTML
      e.clipboardData.setData('text/html', this.copy_backup)
    }
  }

  const on_cut = e => {
    if (selected[0] && this.node_clipboard !== selected[0]) {
      let $node = selected[0].cloneNode(true)
      $node.removeAttribute('data-selected')
      this.copy_backup = $node.outerHTML
      e.clipboardData.setData('text/html', this.copy_backup)
      selected[0].remove()
    }
  }

  const on_paste = e => {
    const clipData = e.clipboardData.getData('text/html')
    const potentialHTML = clipData || this.copy_backup
    if (selected[0] && potentialHTML) {
      e.preventDefault()
      selected[0].appendChild(
        htmlStringToDom(potentialHTML))
    }
  }

  const on_copy_styles = e => {
    e.preventDefault()
    this.copied_styles = selected.map(el =>
      getStyles(el))
  }

  const on_paste_styles = (index = 0) =>
    selected.forEach(el => {
      this.copied_styles[index]
        .map(({prop, value}) =>
          el.style[prop] = value)

      index >= this.copied_styles.length - 1
        ? index = 0
        : index++
    })

  const on_expand_selection = (e, {key}) => {
    e.preventDefault()

    expandSelection({
      query:  combineNodeNameAndClass(selected[0]),
      all:    key.includes('shift'),
    })
  }

  const on_group = (e, {key}) => {
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
  }

  const on_selection = e =>
    !isOffBounds(e.target)
    && selected.length
    && selected[0].textContent != e.target.textContent
    && e.preventDefault()

  const on_keyboard_traversal = (e, {key}) => {
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
  }

  const on_hover = ({target}) => {
    if (isOffBounds(target)) return
    target.setAttribute('data-hover', true)
  }

  const on_hoverout = ({target}) => {
    target.removeAttribute('data-hover')
  }

  const select = el => {
    el.setAttribute('data-selected', true)
    overlayMetaUI(el)
    selected.unshift(el)
    tellWatchers()
  }

  const unselect_all = () => {
    selected
      .forEach(el =>
        $(el).attr({
          'data-selected':      null,
          'data-selected-hide': null,
          'data-label-id':      null,
          'data-hover':         null,
        }))

    handles.forEach(el =>
      el.remove())

    labels.forEach(el =>
      el.remove())

    labels    = []
    handles   = []
    selected  = []
  }

  const delete_all = () => {
    const selected_after_delete = selected.map(el => {
      if (canMoveRight(el))     return canMoveRight(el)
      else if (canMoveLeft(el)) return canMoveLeft(el)
      else if (el.parentNode)   return el.parentNode
    })

    Array.from([...selected, ...labels, ...handles]).forEach(el =>
      el.remove())

    labels    = []
    handles   = []
    selected  = []

    selected_after_delete.forEach(el =>
      select(el))
  }

  const expandSelection = ({query, all = false}) => {
    if (all) {
      const unselecteds = $(query + ':not([data-selected])')
      unselecteds.forEach(select)
    }
    else {
      const potentials = $(query)
      if (!potentials) return

      const root_node_index = potentials.reduce((index, node, i) =>
        combineNodeNameAndClass(node) == query
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

  const combineNodeNameAndClass = node =>
    `${node.nodeName.toLowerCase()}${createClassname(node)}`

  const overlayMetaUI = el => {
    let handle = createHandle(el)
    let label  = createLabel(el, `
      <a>${el.nodeName.toLowerCase()}</a>
      <a>${el.id && '#' + el.id}</a>
      ${createClassname(el).split('.')
        .filter(name => name != '')
        .reduce((links, name) => `
          ${links}
          <a>.${name}</a>
        `, '')
      }
    `)

    let observer        = createObserver(el, {handle,label})
    let parentObserver  = createObserver(el, {handle,label})

    observer.observe(el, { attributes: true })
    parentObserver.observe(el.parentNode, { childList:true, subtree:true })

    $(label).on('DOMNodeRemoved', _ => {
      observer.disconnect()
      parentObserver.disconnect()
    })
  }

  const setLabel = (el, label) =>
    label.update = el.getBoundingClientRect()

  const createLabel = (el, text) => {
    if (!labels[parseInt(el.getAttribute('data-label-id'))]) {
      const label = document.createElement('pb-label')

      label.text = text
      label.position = {
        boundingRect:   el.getBoundingClientRect(),
        node_label_id:  labels.length,
      }
      el.setAttribute('data-label-id', labels.length)

      document.body.appendChild(label)

      $(label).on('query', ({detail}) => {
        if (!detail.text) return
        this.query_text = detail.text

        queryPage('[data-hover]', el =>
          el.setAttribute('data-hover', null))

        queryPage(this.query_text + ':not([data-selected])', el =>
          detail.activator === 'mouseenter'
            ? el.setAttribute('data-hover', true)
            : select(el))
      })

      $(label).on('mouseleave', e => {
        e.preventDefault()
        e.stopPropagation()
        queryPage('[data-hover]', el =>
          el.setAttribute('data-hover', null))
      })

      labels[labels.length] = label
      return label
    }
  }

  const createHandle = el => {
    if (!handles[parseInt(el.getAttribute('data-label-id'))]) {
      const handle = document.createElement('pb-handles')

      handle.position = {
        boundingRect:   el.getBoundingClientRect(),
        node_label_id:  handles.length,
      }

      document.body.appendChild(handle)

      handles[handles.length] = handle
      return handle
    }
  }

  const setHandle = (node, handle) => {
    handle.position = {
      boundingRect:   node.getBoundingClientRect(),
      node_label_id:  node.getAttribute('data-label-id'),
    }
  }

  const createObserver = (node, {label,handle}) =>
    new MutationObserver(list => {
      setLabel(node, label)
      setHandle(node, handle)
    })

  const onSelectedUpdate = (cb, immediateCallback = true) => {
    selectedCallbacks.push(cb)
    if (immediateCallback) cb(selected)
  }

  const removeSelectedCallback = cb =>
    selectedCallbacks = selectedCallbacks.filter(callback => callback != cb)

  const tellWatchers = () =>
    selectedCallbacks.forEach(cb => cb(selected))

  const disconnect = () => {
    unselect_all()
    unlisten()
  }

  watchImagesForUpload()
  listen()

  return {
    select,
    unselect_all,
    onSelectedUpdate,
    removeSelectedCallback,
    disconnect
  }
}
