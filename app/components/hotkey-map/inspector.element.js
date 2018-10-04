import { HotkeyMap } from './base.element'

export class InspectorHotkeys extends HotkeyMap {
  constructor() {
    super()

    this._hotkey    = 'i'
    this._usedkeys  = ['alt']
    this.tool       = 'inspector'
  }
}

customElements.define('hotkeys-inspector', InspectorHotkeys)