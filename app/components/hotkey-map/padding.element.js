import { HotkeyMap } from './base.element'
import { metaKey }   from '../../utilities/'

export class PaddingHotkeys extends HotkeyMap {
  constructor() {
    super()

    this._hotkey    = 'p'
    this._usedkeys  = ['shift',metaKey,'alt']

    this.tool       = 'padding'
  }
}

customElements.define('hotkeys-padding', PaddingHotkeys)
