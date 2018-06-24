import { $, $$ } from 'blingblingjs'
import hotkeys from 'hotkeys-js'

import { getStyle, rgb2hex } from '../features/utils'
import { 
  Selectable, Moveable, Padding, Margin, EditText,
  ChangeForeground, ChangeBackground
} from '../features/'

export default class ToolPallete extends HTMLElement {
  
  constructor() {
    super()

    // todo: these are 2 model groups, with separate selected state scopes
    // todo: duplicate
    // todo: create
    // todo: resize
    // todo: ragrid alignment panel
    this.model = {
      a: 'element',
      v: 'group',
      '': '',
      m: 'move',
      'shift+m': 'margin',
      p: 'padding',
      f: 'font',
      t: 'text',
      c: 'color',
      s: 'search',
    }

    this.innerHTML = this.render()
    this.selectorEngine = Selectable($$('body > *:not(script):not(tool-pallete)'))
  }

  connectedCallback() {
    $$('li', this).on('click', e => 
      this.toolSelected(e.target) && e.stopPropagation())

    this.foregroundPicker = $('#foreground', this)
    this.backgroundPicker = $('#background', this)

    // set colors
    this.foregroundPicker.on('input', e =>
      ChangeForeground($$('[data-selected=true]'), e.target.value))

    this.backgroundPicker.on('input', e =>
      ChangeBackground($$('[data-selected=true]'), e.target.value))

    // read colors
    this.selectorEngine.onSelectedUpdate(elements => {
      if (!elements.length) return

      if (elements.length >= 2) {
        this.foregroundPicker.value = null
        this.backgroundPicker.value = null
      }
      else {
        this.foregroundPicker.value = rgb2hex(getStyle(elements[0], 'color'))
        // todo: better background color parser
        this.backgroundPicker.value = rgb2hex(getStyle(elements[0], 'backgroundColor')) == '#NaN000' ? '#ffffff' : rgb2hex(getStyle(elements[0], 'backgroundColor'))
      }
    })

    Object.entries(this.model).forEach(([key, value]) =>
      hotkeys(key, e => this.toolSelected($(`[data-tool="${value}"]`))))

    this.toolSelected($('[data-tool="move"]'))
    // this.toolSelected($('[data-tool="element"]'))
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

  render() {
    return `
      <ol>
        ${Object.entries(this.model).reduce((list, [key, value]) => `
          ${list}
          <li title='${value}' data-tool='${value}' data-active='${key == 'a' || key == 'm'}'>${key == 'shift+m' ? 'M':key}</li>
        `,'')}
        <input type="color" id='foreground' value='#000000'>
        <input type="color" id='background' value='#ffffff'>
      </ol>
    `
  }

  group() {}
  element() {}

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

  font() {} 

  text() {
    console.info('text initialized')
    this.selectorEngine.onSelectedUpdate(EditText)
    this.deactivate_feature = () => 
      this.selectorEngine.removeSelectedCallback(EditText)
  }

  color() {}
  search() {}
}

customElements.define('tool-pallete', ToolPallete)