import { HotkeyMap } from './base.element'

export class HueshiftHotkeys extends HotkeyMap {
  constructor() {
    super()

    this._hotkey    = 'h'
    this._usedkeys  = ['shift','cmd']
    this.tool       = 'hueshift'
  }
}

customElements.define('hotkeys-hueshift', HueshiftHotkeys)