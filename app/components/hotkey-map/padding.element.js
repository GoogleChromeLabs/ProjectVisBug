import $        from 'blingblingjs'
import hotkeys  from 'hotkeys-js'
import styles   from './base.element.css'

import { HotkeyMap } from './base.element'

export class PaddingHotkeys extends HotkeyMap {
  
  constructor() {
    super()
    this.tool       = 'padding'
    this.$command   = $('[command]', this.$shadow)
  }
}

customElements.define('hotkeys-padding', PaddingHotkeys)