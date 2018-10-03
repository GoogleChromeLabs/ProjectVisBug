import { HotkeyMap } from './base.element'

export class MarginHotkeys extends HotkeyMap {
  constructor() {
    super()
    this.tool = 'margin'
  }
}

customElements.define('hotkeys-margin', MarginHotkeys)