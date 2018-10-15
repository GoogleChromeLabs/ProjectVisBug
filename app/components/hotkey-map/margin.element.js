import { HotkeyMap } from './base.element'

export class MarginHotkeys extends HotkeyMap {
  constructor() {
    super()

    this._hotkey    = 'm'
    this._usedkeys  = ['shift','cmd','alt']

    this.tool       = 'margin'
  }
}

customElements.define('hotkeys-margin', MarginHotkeys)