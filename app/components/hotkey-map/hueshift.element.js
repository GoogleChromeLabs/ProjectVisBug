import { HotkeyMap } from './base.element'
import { hueshift as icon } from '../tool-pallete/toolpallete.icons'
import { metaKey, altKey } from '../../utilities';

export class HueshiftHotkeys extends HotkeyMap {
  constructor() {
    super()

    this._hotkey    = 'h'
    this._usedkeys  = ['shift',metaKey]
    this.tool       = 'hueshift'
  }

  createCommand({e:{code}, hotkeys}) {
    let amount              = hotkeys.shift ? 10 : 1
    let negative            = '[increase/decrease]'
    let negative_modifier   = 'by'
    let side                = '[arrow key]'

    // saturation
    if (hotkeys.cmd) {
      side ='hue'

      if (code === 'ArrowDown')
        negative  = 'decrease'
      if (code === 'ArrowUp')
        negative  = 'increase'
    }
    else if (code === 'ArrowLeft' || code === 'ArrowRight') {
      side = 'saturation'

      if (code === 'ArrowLeft')
        negative  = 'decrease'
      if (code === 'ArrowRight')
        negative  = 'increase'
    }
    // lightness
    else if (code === 'ArrowUp' || code === 'ArrowDown') {
      side = 'lightness'

      if (code === 'ArrowDown')
        negative  = 'decrease'
      if (code === 'ArrowUp')
        negative  = 'increase'
    }

    return {
      negative, negative_modifier, amount, side,
    }
  }

  displayCommand({negative, negative_modifier, side, amount}) {
    if (negative === `±[${altKey}] `)
      negative = '[increase/decrease]'
    if (negative_modifier === ' to ')
      negative_modifier = ' by '

    return `
      <span negative>${negative}</span>
      <span side tool>${side}</span>
      <span light>${negative_modifier}</span>
      <span amount>${amount}</span>
    `
  }
}

customElements.define('hotkeys-hueshift', HueshiftHotkeys)
