import { HotkeyMap } from './base.element'

export class TextHotkeys extends HotkeyMap {
  constructor() {
    super()

    this._hotkey    = 'e'
    this._usedkeys  = []
    this.tool       = 'text'
  }
}

customElements.define('hotkeys-text', TextHotkeys)