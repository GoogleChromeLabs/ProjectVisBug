import { HotkeyMap } from './base.element'

export class AccessibilityHotkeys extends HotkeyMap {
  constructor() {
    super()

    this._hotkey    = 'p'
    this._usedkeys  = ['alt']
    this.tool       = 'accessibility'
  }
}

customElements.define('hotkeys-accessibility', AccessibilityHotkeys)