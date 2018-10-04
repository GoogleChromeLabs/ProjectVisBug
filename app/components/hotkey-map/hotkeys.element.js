import $        from 'blingblingjs'
import hotkeys  from 'hotkeys-js'

import { PaddingHotkeys } from './padding.element'
import { MarginHotkeys }  from './margin.element'
import { MoveHotkeys }    from './move.element'

export class Hotkeys extends HTMLElement {
  
  constructor() {
    super()

    this.tool_map = {
      margin:   document.createElement('hotkeys-margin'),
      padding:  document.createElement('hotkeys-padding'),
      move:     document.createElement('hotkeys-move'),
    }

    Object.values(this.tool_map).forEach(tool =>
      this.appendChild(tool))
  }

  connectedCallback() {
    hotkeys('shift+/', e =>
      this.cur_tool
        ? this.hideTool()
        : this.showTool())

    hotkeys('esc', e => this.hideTool())
  }

  disconnectedCallback() {}

  hideTool() {
    if (!this.cur_tool) return
    this.cur_tool.hide()
    this.cur_tool = null
  }

  showTool() {
    this.cur_tool = this.tool_map[
      $('tool-pallete')[0].activeTool]
    this.cur_tool.show()
  }
}

customElements.define('pb-hotkeys', Hotkeys)