import $        from 'blingblingjs'
import hotkeys  from 'hotkeys-js'
import { metaKey } from '../../utilities/'

import { GuidesHotkeys }        from './guides.element'
import { InspectorHotkeys }     from './inspector.element'
import { AccessibilityHotkeys } from './accessibility.element'
import { MoveHotkeys }          from './move.element'
import { MarginHotkeys }        from './margin.element'
import { PaddingHotkeys }       from './padding.element'
import { AlignHotkeys }         from './align.element'
import { HueshiftHotkeys }      from './hueshift.element'
import { BoxshadowHotkeys }     from './boxshadow.element'
import { PositionHotkeys }      from './position.element'
import { FontHotkeys }          from './font.element'
import { TextHotkeys }          from './text.element'
import { SearchHotkeys }        from './search.element'
import { undoLastEvent, redoLastEvent } from '../../features/history'

export class Hotkeys extends HTMLElement {

  constructor() {
    super()

    this.tool_map = {
      guides:         document.createElement('hotkeys-guides'),
      inspector:      document.createElement('hotkeys-inspector'),
      accessibility:  document.createElement('hotkeys-accessibility'),
      move:           document.createElement('hotkeys-move'),
      margin:         document.createElement('hotkeys-margin'),
      padding:        document.createElement('hotkeys-padding'),
      align:          document.createElement('hotkeys-align'),
      hueshift:       document.createElement('hotkeys-hueshift'),
      boxshadow:      document.createElement('hotkeys-boxshadow'),
      position:       document.createElement('hotkeys-position'),
      font:           document.createElement('hotkeys-font'),
      text:           document.createElement('hotkeys-text'),
      search:         document.createElement('hotkeys-search'),
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
    hotkeys(`${metaKey}+z`, (e) => undoLastEvent());
    hotkeys(`${metaKey}+shift+z`, (e) => redoLastEvent());
  }

  disconnectedCallback() {}

  hideTool() {
    if (!this.cur_tool) return
    this.cur_tool.hide()
    this.cur_tool = null
  }

  showTool() {
    this.cur_tool = this.tool_map[
      $('vis-bug')[0].activeTool]
    this.cur_tool.show()
  }
}

customElements.define('visbug-hotkeys', Hotkeys)
