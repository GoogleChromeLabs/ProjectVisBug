import $          from 'blingblingjs'
import hotkeys    from 'hotkeys-js'

import {
  Handles, Label, Overlay, Gridlines, Corners,
  Hotkeys, Metatip, Ally, Distance, BoxModel, Grip
} from '../'

import {
  Selectable, Moveable, Padding, Margin, EditText, Font,
  Flex, Search, ColorPicker, BoxShadow, HueShift, MetaTip,
  Guides, Screenshot, Position, Accessibility, draggable
} from '../../features/'

import { VisBugStyles }           from '../styles.store'
import { VisBugModel }            from './model'
import * as Icons                 from './vis-bug.icons'
import { provideSelectorEngine }  from '../../features/search'
import { metaKey }                from '../../utilities/'
import { PluginRegistry }         from '../../plugins/_registry'

const modemap = {
  'hex':  'toHexString',
  'hsla': 'toHslString',
  'rgba': 'toRgbString',
}

export default class VisBug extends HTMLElement {
  constructor() {
    super()

    this.toolbar_model  = VisBugModel
    this._tutsBaseURL   = 'tuts' // can be set by content script
    this.$shadow        = this.attachShadow({mode: 'closed'})
  }

  connectedCallback() {
    this.$shadow.adoptedStyleSheets = [VisBugStyles]

    if (!this.$shadow.innerHTML)
      this.setup()

    this.selectorEngine = Selectable(this)
    this.colorPicker    = ColorPicker(this.$shadow, this.selectorEngine)

    provideSelectorEngine(this.selectorEngine)

    this.toolSelected($('[data-tool="guides"]', this.$shadow)[0])
  }

  disconnectedCallback() {
    this.deactivate_feature()
    this.cleanup()
    this.selectorEngine.disconnect()
    hotkeys.unbind(
      Object.keys(this.toolbar_model).reduce((events, key) =>
        events += ',' + key, ''))
    hotkeys.unbind(`${metaKey}+/`)
  }

  setup() {
    const html = document.firstElementChild
    html.style.height = document.body.clientHeight * 1.25 + 'px'
    html.style.width = document.body.clientWidth * 1.75 + 'px'
    html.style.setProperty('--pageUrl', `"${window.location.href}"`)

    this.pageScale = 1

    this.$shadow.innerHTML = this.render()
    this._colormode = modemap['hsla']

    $('li[data-tool]', this.$shadow).on('click', e =>
      this.toolSelected(e.currentTarget) && e.stopPropagation())

    draggable({
      el:this,
      surface: this.$shadow.querySelector('ol:not([colors])'),
      cursor: 'grab',
    })

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

    window.addEventListener("keydown", e => {
      const {ctrlKey, metaKey, key} = e

      if (!this.meta_is_down && metaKey) {
        this.meta_is_down = true
        e.preventDefault()
         // document.body.style.transformOrigin = 
         // `${window.scrollX}px ${window.scrollY}px`
      }

      if (metaKey && key === '=') {
        this.zoomIn()
      }
      else if (metaKey && key === '-') {
        this.zoomOut()
      }
      else if (metaKey && key === '0') {
        this.pageScale = 1
        document.body.style.transform = `scale(1)`
      }
      else if (metaKey && key === '9') {
        // this.pageScale = 1
        // document.body.style.transform = `scale(1)`
        console.log('fit to viewport')
      }
    }, { passive: false })

    window.addEventListener("keyup", ({metaKey}) => {
      if (this.meta_is_down && !metaKey) {
        this.meta_is_down = false
        document.body.style.transition = null
      }
    })

    window.addEventListener("wheel", e => {
      if (this.meta_is_down) {
        e.preventDefault()
        document.body.style.transition = 'none'

        e.deltaY > 0
          ? this.zoomOut(.01)
          : this.zoomIn(.01)
      }
    }, { passive: false })

    window.addEventListener('mousemove', e => {
      this.mouse_x = e.clientX
      this.mouse_y = e.clientY
    }, {passive: true})

    hotkeys(`${metaKey}+equals`, e => {
      e.stopPropagation()
      e.preventDefault()
      this.zoomIn()
      return false
    })

    hotkeys(`${metaKey}+minus`, e => {
      e.stopPropagation()
      e.preventDefault()
      this.zoomOut()
      return false
    })
  }

  cleanup() {
    const bye = [
      ...document.getElementsByTagName('visbug-hover'),
      ...document.getElementsByTagName('visbug-handles'),
      ...document.getElementsByTagName('visbug-label'),
      ...document.getElementsByTagName('visbug-gridlines'),
    ].forEach(el => el.remove())

    this.teardown();

    document.querySelectorAll('[data-pseudo-select=true]')
      .forEach(el =>
        el.removeAttribute('data-pseudo-select'))
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
      <visbug-hotkeys></visbug-hotkeys>
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
        <li class="color" id="foreground" aria-label="Text" aria-description="Change the text color">
          <input type="color" value="">
          ${Icons.color_text}
        </li>
        <li class="color" id="background" aria-label="Background or Fill" aria-description="Change the background color or fill of svg">
          <input type="color" value="">
          ${Icons.color_background}
        </li>
        <li class="color" id="border" aria-label="Border or Stroke" aria-description="Change the border color or stroke of svg">
          <input type="color" value="">
          ${Icons.color_border}
        </li>
      </ol>
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
    this.deactivate_feature = Moveable(this.selectorEngine)
  }

  margin() {
    this.deactivate_feature = Margin(this.selectorEngine)
  }

  padding() {
    this.deactivate_feature = Padding(this.selectorEngine)
  }

  font() {
    this.deactivate_feature = Font(this.selectorEngine)
  }

  text() {
    this.selectorEngine.onSelectedUpdate(EditText)
    this.deactivate_feature = () =>
      this.selectorEngine.removeSelectedCallback(EditText)
  }

  align() {
    this.deactivate_feature = Flex(this.selectorEngine)
  }

  search() {
    this.deactivate_feature = Search($('[data-tool="search"]', this.$shadow))
  }

  boxshadow() {
    this.deactivate_feature = BoxShadow(this.selectorEngine)
  }

  hueshift() {
    this.deactivate_feature = HueShift({
      Color:  this.colorPicker,
      Visbug: this.selectorEngine,
    })
  }

  inspector() {
    this.deactivate_feature = MetaTip(this.selectorEngine)
  }

  accessibility() {
    this.deactivate_feature = Accessibility(this.selectorEngine)
  }

  guides() {
    this.deactivate_feature = Guides(this.selectorEngine)
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

  zoomIn(amount = .1) {
    if (this.pageScale > 10) return
    this.pageScale += amount
    document.body.style.transform = `scale(${this.pageScale})`
  }

  zoomOut(amount = .1) {
    if (this.pageScale < 0) return
    this.pageScale -= amount
    document.body.style.transform = `scale(${this.pageScale})`
  }

  execCommand(command) {
    const query = `/${command}`

    if (PluginRegistry.has(query))
      return PluginRegistry.get(query)({
        selected: this.selectorEngine.selection(),
        query
      })

    return Promise.resolve(new Error("Query not found"))
  }

  get activeTool() {
    return this.active_tool.dataset.tool
  }

  set tutsBaseURL(url) {
    this._tutsBaseURL = url
    this.setup()
  }

  set colorMode(mode) {
    this._colormode = modemap[mode]
  }

  get colorMode() {
    return this._colormode
  }
}

customElements.define('vis-bug', VisBug)
