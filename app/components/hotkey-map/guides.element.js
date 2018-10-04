import { HotkeyMap } from './base.element'

export class GuidesHotkeys extends HotkeyMap {
  constructor() {
    super()

    this._hotkey    = 'g'
    this._usedkeys  = []
    this.tool       = 'guides'
  }
}

customElements.define('hotkeys-guides', GuidesHotkeys)