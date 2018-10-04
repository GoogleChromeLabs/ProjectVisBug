import { HotkeyMap } from './base.element'

export class PositionHotkeys extends HotkeyMap {
  constructor() {
    super()

    this._hotkey    = 'l'
    this._usedkeys  = ['shift','alt']
    this.tool       = 'position'
  }
}

customElements.define('hotkeys-position', PositionHotkeys)