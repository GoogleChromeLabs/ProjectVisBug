import { HotkeyMap } from './base.element'

export class BoxshadowHotkeys extends HotkeyMap {
  constructor() {
    super()

    this._hotkey    = 'd'
    this._usedkeys  = ['shift','cmd']
    this.tool       = 'boxshadow'
  }
}

customElements.define('hotkeys-boxshadow', BoxshadowHotkeys)