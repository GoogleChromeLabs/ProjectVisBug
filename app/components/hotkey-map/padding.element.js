import { HotkeyMap } from './base.element'

export class PaddingHotkeys extends HotkeyMap {
  constructor() {
    super()

    this._hotkey    = 'p'
    this._usedkeys  = ['shift','cmd','alt']

    this.tool       = 'padding'
  }
}

customElements.define('hotkeys-padding', PaddingHotkeys)