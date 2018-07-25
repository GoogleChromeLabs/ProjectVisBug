import $ from 'blingblingjs'
import hotkeys from 'hotkeys-js'
import { TinyColor } from '@ctrl/tinycolor'

import { cursor, move, search, margin, padding, font, 
         type, align, transform, resize, border, hueshift, boxshadow } from './toolpallete.icons' 
import { getStyle } from '../features/utils'
import { 
  Selectable, Moveable, Padding, Margin, EditText, Font, Flex, Search,
  ChangeForeground, ChangeBackground, BoxShadow, HueShift
} from '../features/'

// todo: create?
// todo: resize
export default class ToolPallete extends HTMLElement {
  constructor() {
    super()

    this.toolbar_model = {
      v: { tool: 'move', icon: move },
      // r: { tool: 'resize', icon: resize },
      m: { tool: 'margin', icon: margin },
      p: { tool: 'padding', icon: padding },
      b: { tool: 'border', icon: border },
      a: { tool: 'align', icon: align },
      h: { tool: 'hueshift', icon: hueshift },
      d: { tool: 'boxshadow', icon: boxshadow },
      // t: { tool: 'transform', icon: transform },
      f: { tool: 'font', icon: font },
      e: { tool: 'text', icon: type },
      s: { tool: 'search', icon: search },
    }

    this.innerHTML = this.render()
    this.selectorEngine = Selectable($('body > *:not(script):not(tool-pallete):not(#node-search)'))
  }

  connectedCallback() {
    $('li', this).on('click', e => 
      this.toolSelected(e.currentTarget) && e.stopPropagation())

    this.foregroundPicker = $('#foreground', this)[0]
    this.backgroundPicker = $('#background', this)[0]

    // set colors
    this.foregroundPicker.on('input', e =>
      ChangeForeground($('[data-selected=true]'), e.target.value))

    this.backgroundPicker.on('input', e =>
      ChangeBackground($('[data-selected=true]'), e.target.value))

    // read colors
    this.selectorEngine.onSelectedUpdate(elements => {
      if (!elements.length) return

      if (elements.length >= 2) {
        this.foregroundPicker.value = null
        this.backgroundPicker.value = null
      }
      else {
        const FG = new TinyColor(getStyle(elements[0], 'color'))
        const BG = new TinyColor(getStyle(elements[0], 'backgroundColor'))

        let fg = '#' + FG.toHex()
        let bg = '#' + BG.toHex()

        this.foregroundPicker.attr('value', (FG.originalInput == 'rgb(0, 0, 0)' && elements[0].textContent == '') ? '' : fg)
        this.backgroundPicker.attr('value', BG.originalInput == 'rgba(0, 0, 0, 0)' ? '' : bg)
      }
    })

    Object.entries(this.toolbar_model).forEach(([key, value]) =>
      hotkeys(key, e => this.toolSelected($(`[data-tool="${value.tool}"]`)[0])))

    this.toolSelected($('[data-tool="move"]')[0])
  }

  disconnectedCallback() {}

  toolSelected(el) {
    if (this.active_tool) {
      this.active_tool.attr('data-active', null)
      this.deactivate_feature()
    }

    el.attr('data-active', true)
    this.active_tool = el
    this[el.dataset.tool]()
  }

  render() {
    return `
      <ol>
        ${Object.entries(this.toolbar_model).reduce((list, [key, value]) => `
          ${list}
          <li title='${value.tool}' data-tool='${value.tool}' data-active='${key == 'v'}'>${value.icon}</li>
        `,'')}
        <li></li>
        <li class="color">
          <input title="foreground" type="color" id='foreground' value=''>
        </li>
        <li class="color">
          <input title="background" type="color" id='background' value=''>
        </li>
      </ol>
    `
  }

  move() {
    this.deactivate_feature = Moveable('[data-selected=true]')
  }

  margin() {
    this.deactivate_feature = Margin('[data-selected=true]') 
  }

  padding() {
    this.deactivate_feature = Padding('[data-selected=true]') 
  }

  font() {
    this.deactivate_feature = Font('[data-selected=true]')
  } 

  text() {
    this.selectorEngine.onSelectedUpdate(EditText)
    this.deactivate_feature = () => 
      this.selectorEngine.removeSelectedCallback(EditText)
  }

  align() {
    this.deactivate_feature = Flex('[data-selected=true]')
  }

  search() {
    this.deactivate_feature = Search(this.selectorEngine)
  }

  boxshadow() {
    this.deactivate_feature = BoxShadow('[data-selected=true]')
  }

  hueshift() {
    this.deactivate_feature = HueShift('[data-selected=true]')
  }
}

customElements.define('tool-pallete', ToolPallete)