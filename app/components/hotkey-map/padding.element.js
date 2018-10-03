import { HotkeyMap } from './base.element'

export class PaddingHotkeys extends HotkeyMap {
  constructor() {
    super()
    this.tool = 'padding'
  }
}

customElements.define('hotkeys-padding', PaddingHotkeys)