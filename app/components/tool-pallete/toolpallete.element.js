import $          from 'blingblingjs'
import hotkeys    from 'hotkeys-js'
import styles     from './toolpallete.element.css'

import {
  Handles, Label, Overlay, Gridlines,
  Hotkeys, Metatip, Ally,
} from '../'

import {
  Selectable, Moveable, Padding, Margin, EditText, Font,
  Flex, Search, ColorPicker, BoxShadow, HueShift, MetaTip,
  Guides, Screenshot, Position, Accessibility
} from '../../features/'

import { ToolModel }              from './model'
import * as Icons                 from './toolpallete.icons'
import { provideSelectorEngine }  from '../../features/search'
import { metaKey }                from '../../utilities/'

export default class ToolPallete extends HTMLElement {
  constructor() {
    super()

    this.toolbar_model  = ToolModel
    this._tutsBaseURL   = 'tuts' // can be set by content script
    this.$shadow        = this.attachShadow({mode: 'open'})
  }

  connectedCallback() {
    if (!this.$shadow.innerHTML)
      this.setup()

    this.selectorEngine = Selectable()
    this.colorPicker    = ColorPicker(this.$shadow, this.selectorEngine)
    provideSelectorEngine(this.selectorEngine)
  }

  disconnectedCallback() {
    this.deactivate_feature()
    this.selectorEngine.disconnect()
    hotkeys.unbind(
      Object.keys(this.toolbar_model).reduce((events, key) =>
        events += ',' + key, ''))
    hotkeys.unbind(`${metaKey}+/`)
  }

  setup() {
    this.$shadow.innerHTML = this.render()

    $('li[data-tool]', this.$shadow).on('click', e =>
      this.toolSelected(e.currentTarget) && e.stopPropagation())

    Object.entries(this.toolbar_model).forEach(([key, value]) =>
      hotkeys(key, e => {
        e.preventDefault()
        this.toolSelected(
          $(`[data-tool="${value.tool}"]`, this.$shadow)[0]
        )
      })
    )

    hotkeys(`${metaKey}+/,${metaKey}+.`, e =>
      this.$shadow.host.style.display =
        this.$shadow.host.style.display === 'none'
          ? 'block'
          : 'none')

    this.toolSelected($('[data-tool="guides"]', this.$shadow)[0])
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
      <pb-hotkeys></pb-hotkeys>
      <ol>
        ${Object.entries(this.toolbar_model).reduce((list, [key, tool]) => `
          ${list}
          <li aria-label="${tool.label} Tool" aria-description="${tool.description}" aria-hotkey="${key}" data-tool="${tool.tool}" data-active="${key == 'g'}">
            ${tool.icon}
            ${this.demoTip({key, ...tool})}
          </li>
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

  demoTip({key, tool, label, description, instruction}) {
    return `
      <aside ${tool}>
        <figure>
          <img src="${this._tutsBaseURL}/${tool}.gif" alt="${description}" />
          <figcaption>
            <h2>
              ${label}
              <span hotkey>${key}</span>
            </h2>
            <p>${description}</p>
            ${instruction}
          </figcaption>
        </figure>
      </aside>
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
    let feature = HueShift(this.colorPicker)
    this.selectorEngine.onSelectedUpdate(feature.onNodesSelected)
    this.deactivate_feature = () => {
      this.selectorEngine.removeSelectedCallback(feature.onNodesSelected)
      feature.disconnect()
    }
  }

  inspector() {
    this.deactivate_feature = MetaTip(this.selectorEngine)
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
    this.selectorEngine.onSelectedUpdate(feature.onNodesSelected)
    this.deactivate_feature = () => {
      this.selectorEngine.removeSelectedCallback(feature.onNodesSelected)
      feature.disconnect()
    }
  }

  get activeTool() {
    return this.active_tool.dataset.tool
  }

  set tutsBaseURL(url) {
    this._tutsBaseURL = url
    this.setup()
  }
}

customElements.define('tool-pallete', ToolPallete)
