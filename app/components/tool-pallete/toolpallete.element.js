import $        from 'blingblingjs'
import hotkeys  from 'hotkeys-js'
import styles   from './toolpallete.element.css'

import { 
  HotkeyMap, Handles, Label, Overlay, Gridlines, 
  Metatip, Ally, 
} from '../'

import { 
  Selectable, Moveable, Padding, Margin, EditText, Font, 
  Flex, Search, ColorPicker, BoxShadow, HueShift, MetaTip, 
  Guides, Screenshot, Position, Accessibility
} from '../../features/'

import * as Icons                 from './toolpallete.icons' 
import { provideSelectorEngine }  from '../../features/search'

export default class ToolPallete extends HTMLElement {
  constructor() {
    super()

    this.toolbar_model = {
      g: { tool: 'guides', icon: Icons.ruler, label: 'Guides', description: 'Verify alignment' },
      i: { tool: 'inspector', icon: Icons.inspector, label: 'Inspect', description: 'Peak into the common & current styles of an element' },
      x: { tool: 'accessibility', icon: Icons.accessibility, label: 'Accessibility', description: 'Peak into a11y attributes & compliance status' },
      v: { tool: 'move', icon: Icons.move, label: 'Move', description: 'Push elements in, out & around' },
      // r: { tool: 'resize', icon: Icons.resize, label: 'Resize', description: '' },
      m: { tool: 'margin', icon: Icons.margin, label: 'Margin', description: 'Add or subtract outer space' },
      p: { tool: 'padding', icon: Icons.padding, label: 'Padding', description: 'Add or subtract inner space' },
      // b: { tool: 'border', icon: Icons.border, label: 'Border', description: '' },
      a: { tool: 'align', icon: Icons.align, label: 'Flexbox Align', description: 'Create or modify direction, distribution & alignment' },
      h: { tool: 'hueshift', icon: Icons.hueshift, label: 'Hue Shift', description: 'Change fg/bg hue, brightness, saturation & opacity' },
      d: { tool: 'boxshadow', icon: Icons.boxshadow, label: 'Shadow', description: 'Create & adjust position, blur & opacity of a box shadow' },
      // t: { tool: 'transform', icon: Icons.transform, label: '3D Transform', description: '' },
      l: { tool: 'position', icon: Icons.position, label: 'Position', description: 'Move svg (x,y) and elements (top,left,bottom,right)' },
      f: { tool: 'font', icon: Icons.font, label: 'Font Styles', description: 'Change size, leading, kerning, & weight' },
      e: { tool: 'text', icon: Icons.type, label: 'Edit Text', description: 'Change any text on the page' },
      // c: { tool: 'screenshot', icon: Icons.camera, label: 'Screenshot', description: 'Screenshot selected elements or the entire page' },
      s: { tool: 'search', icon: Icons.search, label: 'Search', description: 'Select elements by searching for them' },
    }

    this.$shadow = this.attachShadow({mode: 'open'})
    this.$shadow.innerHTML = this.render()

    this._selectorEngine = Selectable()
    this.colorPicker    = ColorPicker(this.$shadow, this._selectorEngine)
    provideSelectorEngine(this._selectorEngine)
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
    this._selectorEngine.disconnect()
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
      </ol>
      <ol colors>
        <li style="display: none;" class="color" id="foreground" aria-label="Text" aria-description="Change the text color">
          <input type="color" value="">
          ${Icons.color_text}
        </li>
        <li style="display: none;" class="color" id="background" aria-label="Background or Fill" aria-description="Change the background color or fill of svg">
          <input type="color" value="">
          ${Icons.color_background}
        </li>
        <li style="display: none;" class="color" id="border" aria-label="Border or Stroke" aria-description="Change the border color or stroke of svg">
          <input type="color" value="">
          ${Icons.color_border}
        </li>
      </ol>
    `
  }

  styles() {
    return `
      <style>
        ${styles}
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
    this._selectorEngine.onSelectedUpdate(EditText)
    this.deactivate_feature = () => 
      this._selectorEngine.removeSelectedCallback(EditText)
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
    let feature = HueShift(this.colorPicker)
    this._selectorEngine.onSelectedUpdate(feature.onNodesSelected)
    this.deactivate_feature = () => {
      this._selectorEngine.removeSelectedCallback(feature.onNodesSelected)
      feature.disconnect()
    }
  }

  inspector() {
    this.deactivate_feature = MetaTip(this._selectorEngine)
  }

  accessibility() {
    this.deactivate_feature = Accessibility()
  }

  guides() {
    this.deactivate_feature = Guides()
  }

  screenshot() {
    this.deactivate_feature = Screenshot()
  }

  position() {
    let feature = Position()
    this._selectorEngine.onSelectedUpdate(feature.onNodesSelected)
    this.deactivate_feature = () => {
      this._selectorEngine.removeSelectedCallback(feature.onNodesSelected)
      feature.disconnect()
    }
  }

  get activeTool() {
    return this.active_tool.dataset.tool
  }

  get selectorEngine() {
    return this._selectorEngine
  }
}

customElements.define('tool-pallete', ToolPallete)