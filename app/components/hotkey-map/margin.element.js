import { HotkeyMap } from './base.element'
import { metaKey, altKey }   from '../../utilities/'

export class MarginHotkeys extends HotkeyMap {
  constructor() {
    super()

    this._hotkey    = 'm'
    this._usedkeys  = ['shift',metaKey,altKey]

    this.tool       = 'margin'
  }
}

customElements.define('hotkeys-margin', MarginHotkeys)
