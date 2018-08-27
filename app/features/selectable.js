import $ from 'blingblingjs'
import hotkeys from 'hotkeys-js'

import { EditText } from './text'
import { canMoveLeft, canMoveRight, canMoveUp } from './move'
import { watchImagesForUpload } from './imageswap'
import { queryPage } from './search'
import { htmlStringToDom, createClassname, isOffBounds, getStyles } from './utils'

export function Selectable() {
  const elements          = $('body')
  let selected            = []
  let selectedCallbacks   = []
  let labels              = []

  const listen = () => {
    elements.on('click', on_click)
    elements.on('dblclick', on_dblclick)
    elements.on('selectstart', on_selection)
    elements.on('mouseover', on_hover)
    elements.on('mouseout', on_hoverout)

    document.addEventListener('copy', on_copy)
    document.addEventListener('cut', on_cut)
    document.addEventListener('paste', on_paste)

    hotkeys('cmd+alt+c', on_copy_styles)
    hotkeys('cmd+alt+v', e => on_paste_styles())
    hotkeys('esc', on_esc)
    hotkeys('cmd+d', on_duplicate)
    hotkeys('backspace,del,delete', on_delete)
    hotkeys('alt+del,alt+backspace', on_clearstyles)
    hotkeys('cmd+e,cmd+shift+e', on_expand_selection)
    hotkeys('cmd+g,cmd+shift+g', on_group)
    hotkeys('tab,shift+tab,enter,shift+enter', on_keyboard_traversal)
  }

  const unlisten = () => {
    elements.off('click', on_click)
    elements.off('dblclick', on_dblclick)
    elements.off('selectstart', on_selection)
    elements.off('mouseover', on_hover)
    elements.off('mouseout', on_hoverout)

    document.removeEventListener('copy', on_copy)
    document.removeEventListener('cut', on_cut)
    document.removeEventListener('paste', on_paste)

    hotkeys.unbind('esc,cmd+d,backspace,del,delete,alt+del,alt+backspace,cmd+e,cmd+shift+e,cmd+g,cmd+shift+g,tab,shift+tab,enter,shift+enter')
  }

  const on_click = e => {
    if (isOffBounds(e.target) && !selected.filter(el => el == e.target).length) 
      return

    e.preventDefault()
    e.stopPropagation()
    if (!e.shiftKey) unselect_all()
    select(e.target)
  }

  const on_dblclick = e => {
    e.preventDefault()
    e.stopPropagation()
    if (isOffBounds(e.target)) return
    EditText([e.target])
    $('tool-pallete')[0].toolSelected('text')
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

  const on_copy_styles = e =>
    this.copied_styles = selected.map(el =>
      getStyles(el))

  const on_paste_styles = (index = 0) =>
    selected.forEach(el =>
      this.copied_styles[index]
        .map(({prop, value}) =>
          el.style[prop] = value)
        .forEach(style =>
          index >= this.copied_styles.length
            ? index = 0
            : index++))

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

  const on_hoverout = ({target}) =>
    target.removeAttribute('data-hover')

  const select = el => {
    if (el.nodeName === 'svg' || el.ownerSVGElement) return

    el.setAttribute('data-selected', true)

    createLabel(el, `
      <a href="#">${el.nodeName.toLowerCase()}</a>
      <a href="#">${el.id && '#' + el.id}</a>
      ${createClassname(el).split('.')
        .filter(name => name != '')
        .reduce((links, name) => `
          ${links}
          <a href="#">.${name}</a>
        `, '')
      }
    `)

    showHandles(el)

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

    labels.forEach(el =>
      el.remove())

    labels    = []
    selected  = []
  }

  const delete_all = () => {
    [...selected, ...labels].forEach(el =>
      el.remove())

    labels   = []
    selected = []
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

  const setLabel = (el, label) => {
    const { x, y } = el.getBoundingClientRect()
    label.style.top  = y + window.scrollY - 1 + 'px'
    label.style.left = x - 1 + 'px'
  }

  const createLabel = (el, text) => {
    if (!labels[parseInt(el.getAttribute('data-label-id'))]) {
      label = document.createElement('div')
      label.classList.add('pb-selectedlabel')
      label.style = `
        position: absolute;
        z-index: 9999;
        transform: translateY(-100%);
        background: hsla(330, 100%, 71%, 80%);
        color: white;
        display: inline-flex;
        justify-content: center;
        font-size: 0.8rem;
        padding: 0.25em 0.4em 0.15em;
        line-height: 1.1;
      `
      label.innerHTML = `
        <style>
          [data-label-id] > a {
            text-decoration: none;
            color: inherit;
          }
          [data-label-id] > a:hover {
            text-decoration: underline;
            color: white;
          }
        </style>
        ${text}
      `

      setLabel(el, label)

      document.body.appendChild(label)

      Array.from([el, label]).forEach(node =>
        node.setAttribute('data-label-id', labels.length))

      let observer = createObserver(el, label)
      observer.observe(el, { attributes: true })

      $(label).on('DOMNodeRemoved', _ =>
        observer.disconnect())

      $('a', label).on('click mouseenter', e => {
        e.preventDefault()
        e.stopPropagation()
        queryPage(e.target.textContent, el =>
          e.type === 'mouseenter'
            ? el.setAttribute('data-hover', true)
            : select(el))
      })

      $('a', label).on('mouseleave', e => {
        e.preventDefault()
        e.stopPropagation()
        queryPage(e.target.textContent, el =>
          e.type === 'mouseleave' && el.setAttribute('data-hover', null))
      })

      labels[labels.length] = label
    }
  }

  const showHandles = node => {
    const { x, y, width, height, top, left } = node.getBoundingClientRect()

    if ($('.pb-gridlines').length) {
      const c = $('.pb-gridlines')
      c[0].style.top = top + 'px'
      c[0].style.left = left + 'px'
      c.attr({
        width:    width + 'px', 
        height:   height + 'px',
        viewBox:  `0 0 ${width} ${height}`,
      })
    }
    else {
      const overlay = `
        <svg 
          class="pb-gridlines"
          style="
            position:absolute;
            top:${top}px;
            left:${left}px;
            overflow:visible;
            pointer-events:none;
          " 
          width="${width}" 
          height="${height}" 
          viewBox="0 0 ${width} ${height}" 
          version="1.1" xmlns="http://www.w3.org/2000/svg"
        >
          <rect stroke="hotpink" fill="none" width="100%" height="100%"></rect>
          <circle stroke="hotpink" fill="white" cx="0" cy="0" r="2"></circle>
          <circle stroke="hotpink" fill="white" cx="100%" cy="0" r="2"></circle>
          <circle stroke="hotpink" fill="white" cx="100%" cy="100%" r="2"></circle>
          <circle stroke="hotpink" fill="white" cx="0" cy="100%" r="2"></circle>
        </svg>
      `
      // <circle fill="hotpink" cx="${width/2}" cy="0" r="2"></circle>
      // <circle fill="hotpink" cx="0" cy="${height/2}" r="2"></circle>
      // <circle fill="hotpink" cx="${width/2}" cy="${height}" r="2"></circle>
      // <circle fill="hotpink" cx="${width}" cy="${height/2}" r="2"></circle>

      document.body.appendChild(
        htmlStringToDom(overlay))
    }
  }

  const createObserver = (node, label) => 
    new MutationObserver(list =>
      setLabel(node, label))

  const onSelectedUpdate = cb =>
    selectedCallbacks.push(cb) && cb(selected)

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
    disconnect,
  }
}