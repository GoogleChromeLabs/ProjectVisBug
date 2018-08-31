import $ from 'blingblingjs'
import hotkeys from 'hotkeys-js'

import * as Icons from './toolpallete.icons' 
import { 
  Selectable, Moveable, Padding, Margin, EditText, Font, Flex, Search,
  ColorPicker, BoxShadow, HueShift, MetaTip, Guides, Screenshot
} from '../features/'

import { provideSelectorEnginer } from '../features/search'

export default class ToolPallete extends HTMLElement {
  constructor() {
    super()

    this.toolbar_model = {
      g: { tool: 'guides', icon: Icons.ruler, label: 'Guides', description: 'Verify alignment' },
      i: { tool: 'inspector', icon: Icons.inspector, label: 'Inspect', description: 'Peak into the common & current styles of an element' },
      v: { tool: 'move', icon: Icons.move, label: 'Move', description: 'Push elements in, out & around' },
      // r: { tool: 'resize', icon: Icons.resize, label: 'Resize', description: '' },
      m: { tool: 'margin', icon: Icons.margin, label: 'Margin', description: 'Add or subtract outer space' },
      p: { tool: 'padding', icon: Icons.padding, label: 'Padding', description: 'Add or subtract inner space' },
      // b: { tool: 'border', icon: Icons.border, label: 'Border', description: '' },
      a: { tool: 'align', icon: Icons.align, label: 'Flexbox Align', description: 'Create or modify direction, distribution & alignment' },
      h: { tool: 'hueshift', icon: Icons.hueshift, label: 'Hue Shift', description: 'Change fg/bg hue, brightness, saturation & opacity' },
      d: { tool: 'boxshadow', icon: Icons.boxshadow, label: 'Shadow', description: 'Create & adjust position, blur & opacity of a box shadow' },
      // t: { tool: 'transform', icon: Icons.transform, label: '3D Transform', description: '' },
      f: { tool: 'font', icon: Icons.font, label: 'Font Styles', description: 'Change size, leading, kerning, & weight' },
      e: { tool: 'text', icon: Icons.type, label: 'Edit Text', description: 'Change any text on the page' },
      c: { tool: 'screenshot', icon: Icons.camera, label: 'Screenshot', description: 'Screenshot selected elements or the entire page' },
      s: { tool: 'search', icon: Icons.search, label: 'Search', description: 'Select elements by searching for them' },
    }

    this.$shadow = this.attachShadow({mode: 'open'})
    this.$shadow.innerHTML = this.render()

    this.selectorEngine = Selectable()
    this.colorPicker    = ColorPicker(this.$shadow, this.selectorEngine)
    provideSelectorEnginer(this.selectorEngine)
  }

  connectedCallback() {
    $('li[data-tool]', this.$shadow).on('click', e => 
      this.toolSelected(e.currentTarget) && e.stopPropagation())

    Object.entries(this.toolbar_model).forEach(([key, value]) =>
      hotkeys(key, e => 
        this.toolSelected(
          $(`[data-tool="${value.tool}"]`, this.$shadow)[0])))

    this.toolSelected($('[data-tool="guides"]', this.$shadow)[0])
  }

  disconnectedCallback() {
    this.deactivate_feature()
    this.selectorEngine.disconnect()
    hotkeys.unbind(
      Object.keys(this.toolbar_model).reduce((events, key) =>
        events += ',' + key, ''))
  }

  toolSelected(el) {
    if (typeof el === 'string')
      el = $(`[data-tool="${el}"]`, this.$shadow)[0]

    if (this.active_tool && this.active_tool.dataset.tool === el.dataset.tool) return

    if (this.active_tool) {
      this.active_tool.attr('data-active', null)
      this.deactivate_feature()
      this.selectorEngine.toggleOverlay(true)
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
          <li aria-label="${value.label} Tool (${key})" aria-description="${value.description}" data-tool="${value.tool}" data-active="${key == 'g'}">${value.icon}</li>
        `,'')}
        <li style="display: none;" class="color" id="foreground" aria-label="Text or Stroke" aria-description="Change the text color or stroke of svg">
          <input type="color" value="">
          ${Icons.color_text}
        </li>
        <li style="display: none;" class="color" id="background" aria-label="Background or Fill" aria-description="Change the background color or fill of svg">
          <input type="color" value="">
          ${Icons.color_background}
        </li>
      </ol>
    `
  }

  styles() {
    return `
      <style>
        :host {
          --theme-bg: hsl(0,0%,100%);
          --theme-color: hotpink;
          --theme-icon_color: hsl(0,0%,20%);
          --theme-tool_selected: hsl(0,0%,98%);
        }

        :host > ol {
          position: fixed;
          top: 1rem;
          left: 1rem;
          z-index: 99998; 

          display: flex;
          flex-direction: column;

          box-shadow: 0 0.25rem 0.5rem hsla(0,0%,0%,10%);
          margin: 0;
          padding: 0;
          list-style-type: none;
        }

        :host li {
          height: 2.5rem;
          width: 2.5rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          position: relative;
          background: var(--theme-bg);
        }

        :host li[data-tool]:hover {
          cursor: pointer;
          background: var(--theme-tool_selected);
        }

        :host li[data-tool]:hover:after,
        :host li.color:hover:after {
          content: attr(aria-label) "\\A" attr(aria-description);
          position: absolute;
          left: 100%;
          top: 0;
          z-index: -1;
          box-shadow: 0 0.1rem 0.1rem hsla(0,0%,0%,10%);
          height: 100%;
          display: inline-flex;
          align-items: center;
          padding: 0 0.5rem;
          background: var(--theme-color);
          color: white;
          font-size: 0.8rem;
          white-space: pre;
        }

        :host li.color:hover:after {
          top: 0;
        }

        :host li[data-tool='align'] > svg {
          transform: rotateZ(90deg);
        }

        :host li[data-active=true] {
          background: var(--theme-tool_selected);
        }

        :host li[data-active=true] > svg:not(.icon-cursor) { 
          fill: var(--theme-color); 
        }

        :host li[data-active=true] > .icon-cursor { 
          stroke: var(--theme-color); 
        }

        :host .color {
          margin-top: 0.25rem;
        }

        :host li > svg {
          width: 50%;
          fill: var(--theme-icon_color);
        }

        :host li > svg.icon-cursor {
          width: 35%;
          fill: white;
          stroke: var(--theme-icon_color);
          stroke-width: 2px;
        }

        :host li[data-tool="search"] > .search {
          position: absolute;
          left: 100%;
          top: 0;
          height: 100%;
          z-index: 9999;
        }

        :host li[data-tool="search"] > .search > input {
          border: none;
          font-size: 1rem;
          padding: 0.4em;
          outline: none;
          height: 100%;
          width: 250px;
          box-sizing: border-box;
          caret-color: hotpink;
        }

        :host input[type='color'] {
          opacity: 0.01;
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          z-index: 1;
          box-sizing: border-box;
          border: white;
          padding: 0;
        }

        :host input[type='color']:focus {
          outline: none;
        }

        :host input[type='color']::-webkit-color-swatch-wrapper { 
          padding: 0;
        }

        :host input[type='color']::-webkit-color-swatch { 
          border: none;
        }

        :host input[type='color'][value='']::-webkit-color-swatch { 
          background-color: transparent !important; 
          background-image: linear-gradient(155deg, #ffffff 0%,#ffffff 46%,#ff0000 46%,#ff0000 54%,#ffffff 55%,#ffffff 100%);
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
    this.deactivate_feature = Search($('[data-tool="search"]', this.$shadow))
  }

  boxshadow() {
    this.deactivate_feature = BoxShadow('[data-selected=true]')
  }

  hueshift() {
    this.deactivate_feature = HueShift('[data-selected=true]')
  }

  inspector() {
    this.deactivate_feature = MetaTip()
  }

  guides() {
    this.selectorEngine.toggleOverlay(false)
    this.deactivate_feature = Guides()
  }

  screenshot() {
    this.deactivate_feature = Screenshot()
  }

  activeTool() {
    return this.active_tool.dataset.tool
  }
}

customElements.define('tool-pallete', ToolPallete)