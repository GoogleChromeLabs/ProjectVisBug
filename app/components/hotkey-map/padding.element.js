import { HotkeyMap } from './base.element'
import { metaKey, altKey }   from '../../utilities/'

export class PaddingHotkeys extends HotkeyMap {
  constructor() {
    super()

    this._hotkey    = 'p'
    this._usedkeys  = ['shift',metaKey,altKey]

    this.tool       = 'padding'
  }
}

customElements.define('hotkeys-padding', PaddingHotkeys)
