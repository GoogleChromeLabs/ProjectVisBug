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
      // b: { tool: 'border', icon: border },
      a: { tool: 'align', icon: align },
      h: { tool: 'hueshift', icon: hueshift },
      d: { tool: 'boxshadow', icon: boxshadow },
      // t: { tool: 'transform', icon: transform },
      f: { tool: 'font', icon: font },
      e: { tool: 'text', icon: type },
      // s: { tool: 'search', icon: search },
    }

    this.$shadow = this.attachShadow({mode: 'open'})
    this.$shadow.innerHTML = this.render()

    // this.innerHTML = this.render()
    this.selectorEngine = Selectable($('body > *:not(script):not(tool-pallete):not(#node-search)'))
  }

  connectedCallback() {
    $('li', this.$shadow).on('click', e => 
      this.toolSelected(e.currentTarget) && e.stopPropagation())

    this.foregroundPicker = $('#foreground', this.$shadow)[0]
    this.backgroundPicker = $('#background', this.$shadow)[0]

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
      hotkeys(key, e => 
        this.toolSelected(
          $(`[data-tool="${value.tool}"]`, this.$shadow)[0])))

    this.toolSelected($('[data-tool="move"]', this.$shadow)[0])
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
      ${this.styles()}
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

  styles() {
    return `
      <style>
        :host {
          position: fixed;
          top: 1rem;
          left: 1rem;
          z-index: 99999; 

          background: white;
          box-shadow: 0 0.25rem 0.5rem hsla(0,0%,0%,10%);

          --darkest-grey: hsl(0,0%,2%);
          --darker-grey: hsl(0,0%,5%);
          --dark-grey: hsl(0,0%,20%);
          --grey: hsl(0,0%,50%);
          --light-grey: hsl(0,0%,60%);
          --lighter-grey: hsl(0,0%,80%);
          --lightest-grey: hsl(0,0%,95%);
          --theme-color: hotpink;
        }

        :host > ol {
          margin: 0;
          padding: 0;
          list-style-type: none;

          display: flex;
          flex-direction: column;
        }

        :host li {
          height: 2.5rem;
          width: 2.5rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        :host li:hover {
          cursor: pointer;
          background: hsl(0,0%,98%);
        }

        :host li[data-tool='align'] {
          transform: rotateZ(90deg);
        }

        :host li[data-active=true] {
          background: hsl(0,0%,98%);
        }

        :host li[data-active=true] > svg:not(.icon-cursor) { 
          fill: var(--theme-color); 
        }

        :host li[data-active=true] > .icon-cursor { 
          stroke: var(--theme-color); 
        }

        :host li:empty {
          height: 0.25rem;
          background: hsl(0,0%,90%);
        }

        :host li.color {
          height: 20px;
        }

        :host li > svg {
          width: 50%;
          fill: var(--dark-grey);
        }

        :host li > svg.icon-cursor {
          width: 35%;
          fill: white;
          stroke: var(--dark-grey);
          stroke-width: 2px;
        }

        :host input[type='color'] {
          width: 100%;
          box-sizing: border-box;
          border: white;
        }

        :host input[type='color'][value='']::-webkit-color-swatch { 
          background-color: transparent !important; 
          background-image: linear-gradient(135deg, #ffffff 0%,#ffffff 46%,#ff0000 46%,#ff0000 64%,#ffffff 64%,#ffffff 100%);;
        }
      </style>
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