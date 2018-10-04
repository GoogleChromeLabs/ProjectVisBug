import { HotkeyMap } from './base.element'

export class SearchHotkeys extends HotkeyMap {
  constructor() {
    super()

    this._hotkey    = 's'
    this._usedkeys  = []
    this.tool       = 'search'
  }
}

customElements.define('hotkeys-search', SearchHotkeys)