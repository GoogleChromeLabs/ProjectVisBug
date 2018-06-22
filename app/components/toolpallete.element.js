import { $, $$ } from 'blingblingjs'
import hotkeys from 'hotkeys-js'

import { Selectable } from '../features/selectable'
import { Moveable } from '../features/move'
import { Padding } from '../features/padding'
import { Margin } from '../features/margin'

export default class ToolPallete extends HTMLElement {
  
  constructor() {
    super()
    this.innerHTML = this.render()
    Selectable($$('article > *'))

    // dispatch event example
    // this.dispatchEvent(
    //   new CustomEvent('outbound-message', 
    //     { detail: payload, bubbles: false }))
  }

  connectedCallback() {
    $$('li', this).on('click', ({target}) => 
      this.itemSelected(target))

    hotkeys('m', e => this.itemSelected($('[data-tool="move"]')))
    hotkeys('shift+m', e => this.itemSelected($('[data-tool="margin"]')))
    hotkeys('p', e => this.itemSelected($('[data-tool="padding"]')))
    hotkeys('f', e => this.itemSelected($('[data-tool="font"]')))

    this.itemSelected($('[data-tool="move"]'))
  }

  disconnectedCallback() {}

  itemSelected(el) {
    if (this.active_tool) {
      this.active_tool.removeAttribute('data-active')
      this.deactivate_feature()
    }

    el.setAttribute('data-active', true)
    this.active_tool = el
    this[el.dataset.tool]()
  }

  render() {
    return `
      <ol>
        <li data-tool='move' data-active='true'>m</li>
        <li data-tool='margin'>M</li>
        <li data-tool='padding'>P</li>
        <li data-tool='font'>F</li>
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
}

customElements.define('tool-pallete', ToolPallete)