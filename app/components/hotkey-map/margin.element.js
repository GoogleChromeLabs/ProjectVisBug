import { HotkeyMap } from './base.element'
import { metaKey }   from '../../utilities/'

export class MarginHotkeys extends HotkeyMap {
  constructor() {
    super()

    this._hotkey    = 'm'
    this._usedkeys  = ['shift',metaKey,'alt']

    this.tool       = 'margin'
  }
}

customElements.define('hotkeys-margin', MarginHotkeys)
