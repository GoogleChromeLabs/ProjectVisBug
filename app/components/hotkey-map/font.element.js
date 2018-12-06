import { HotkeyMap } from './base.element'
import { metaKey, altKey } from '../../utilities';

export class FontHotkeys extends HotkeyMap {
  constructor() {
    super()

    this._hotkey    = 'f'
    this._usedkeys  = ['shift',metaKey]
    this.tool       = 'font'
  }

  createCommand({e:{code}, hotkeys}) {
    let amount              = hotkeys.shift ? 10 : 1
    let negative            = '[increase/decrease]'
    let negative_modifier   = 'by'
    let side                = '[arrow key]'

    // kerning
    if (hotkeys.shift && (code === 'ArrowLeft' || code === 'ArrowRight')) {
      side    = 'kerning'
      amount  = '1px'

      if (code === 'ArrowLeft')
        negative  = 'decrease'
      if (code === 'ArrowRight')
        negative  = 'increase'
    }
    // leading
    else if (hotkeys.shift && (code === 'ArrowUp' || code === 'ArrowDown')) {
      side    = 'leading'
      amount  = '1px'

      if (code === 'ArrowUp')
        negative  = 'increase'
      if (code === 'ArrowDown')
        negative  = 'decrease'
    }
    // font weight
    else if (hotkeys.cmd && (code === 'ArrowUp' || code === 'ArrowDown')) {
      side                = 'font weight'
      amount              = ''
      negative_modifier   = ''

      if (code === 'ArrowUp')
        negative  = 'increase'
      if (code === 'ArrowDown')
        negative  = 'decrease'
    }
    // font size
    else if (code === 'ArrowUp' || code === 'ArrowDown') {
      side    = 'font size'
      amount  = '1px'

      if (code === 'ArrowUp')
        negative  = 'increase'
      if (code === 'ArrowDown')
        negative  = 'decrease'
    }
    // text alignment
    else if (code === 'ArrowRight' || code === 'ArrowLeft') {
      side                = 'text alignment'
      amount              = ''
      negative            = 'adjust'
      negative_modifier   = ''
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

customElements.define('hotkeys-font', FontHotkeys)
