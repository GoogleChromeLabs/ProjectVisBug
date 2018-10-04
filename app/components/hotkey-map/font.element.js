import { HotkeyMap } from './base.element'

export class FontHotkeys extends HotkeyMap {
  constructor() {
    super()

    this._hotkey    = 'f'
    this._usedkeys  = ['shift','cmd']
    this.tool       = 'font'
  }
}

customElements.define('hotkeys-font', FontHotkeys)