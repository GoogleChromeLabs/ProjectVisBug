import { $, $$ } from 'blingblingjs'
import hotkeys from 'hotkeys-js'

import { Selectable, Moveable, Padding, Margin, EditText } from '../features/'

export default class ToolPallete extends HTMLElement {
  
  constructor() {
    super()
    this.innerHTML = this.render()
    this.selectorEngine = Selectable($$('body > *:not(script):not(tool-pallete)'), this.nodeSelected)

    // dispatch event example
    // this.dispatchEvent(
    //   new CustomEvent('outbound-message', 
    //     { detail: payload, bubbles: false }))
  }

  connectedCallback() {
    $$('li', this).on('click', ({target}) => 
      this.toolSelected(target))

    hotkeys('m', e => this.toolSelected($('[data-tool="move"]')))
    hotkeys('shift+m', e => this.toolSelected($('[data-tool="margin"]')))
    hotkeys('p', e => this.toolSelected($('[data-tool="padding"]')))
    // hotkeys('f', e => this.toolSelected($('[data-tool="font"]')))
    hotkeys('t', e => this.toolSelected($('[data-tool="text"]')))

    this.toolSelected($('[data-tool="move"]'))
  }

  disconnectedCallback() {}

  toolSelected(el) {
    if (this.active_tool) {
      this.active_tool.removeAttribute('data-active')
      this.deactivate_feature()
    }

    el.setAttribute('data-active', true)
    this.active_tool = el
    this[el.dataset.tool]()
  }

  nodeSelected(els) {
    console.log(els)
  }

  render() {
    return `
      <ol>
        <li data-tool='group'>v</li>
        <li data-tool='element' data-active='true'>a</li>
        <li></li>
        <li data-tool='move' data-active='true'>m</li>
        <li data-tool='margin'>M</li>
        <li data-tool='padding'>p</li>
        <li data-tool='font'>f</li>
        <li data-tool='text'>t</li>
        <li data-tool='color'>c</li>
        <li data-search='search'>s</li>
      </ol>
    `
  }

  move() {
    console.info('move initialized')
    this.deactivate_feature = Moveable('[data-selected=true]')
  }

  margin() {
    console.info('margin initialized')
    this.deactivate_feature = Margin('[data-selected=true]') 
  }

  padding() {
    console.info('padding initialized')
    this.deactivate_feature = Padding('[data-selected=true]') 
  }

  font() {
    console.info('font initialized')
  }

  text() {
    console.info('font initialized')
    this.selectorEngine.onSelectedUpdate(EditText)
    this.deactivate_feature = () => 
      this.selectorEngine.removeSelectedCallback(EditText)
  }
}

customElements.define('tool-pallete', ToolPallete)