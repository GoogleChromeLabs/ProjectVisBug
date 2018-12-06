import { HotkeyMap } from './base.element'
import { metaKey } from '../../utilities';

const h_alignOptions  = ['left','center','right']
const v_alignOptions  = ['top','center','bottom']
const distOptions     = ['evenly','normal','between']

export class AlignHotkeys extends HotkeyMap {
  constructor() {
    super()

    this._hotkey   = 'a'
    this._usedkeys = [metaKey,'shift']

    this._htool   = 0
    this._vtool   = 0
    this._dtool   = 1

    this._side         = 'top left'
    this._direction    = 'row'
    this._distribution = distOptions[this._dtool]

    this.tool     = 'align'
  }

  createCommand({e:{code}, hotkeys}) {
    let amount            = this._distribution
      , negative_modifier = this._direction
      , side              = this._side
      , negative

    if (hotkeys.cmd && (code === 'ArrowRight' || code === 'ArrowDown')) {
      negative_modifier = code === 'ArrowDown'
        ? 'column'
        : 'row'
      this._direction = negative_modifier
    }
    else {
      if (code === 'ArrowUp')           side = this.clamp(v_alignOptions, '_vtool')
      else if (code === 'ArrowDown')    side = this.clamp(v_alignOptions, '_vtool', true)
      else                              side = v_alignOptions[this._vtool]

      if (code === 'ArrowLeft')         side += ' ' + this.clamp(h_alignOptions, '_htool')
      else if (code === 'ArrowRight')   side += ' ' + this.clamp(h_alignOptions, '_htool', true)
      else                              side += ' ' + h_alignOptions[this._htool]

      this._side = side

      if (hotkeys.shift && (code === 'ArrowRight' || code === 'ArrowLeft')) {
        amount = this.clamp(distOptions, '_dtool', code === 'ArrowRight')
        this._distribution = amount
      }
    }

    return {
      negative, negative_modifier, amount, side,
    }
  }

  displayCommand({side, amount, negative_modifier}) {
    if (amount == 1) amount = this._distribution
    if (negative_modifier == ' to ') negative_modifier = this._direction

    return `
      <span tool>${this._tool}</span>
      <span light> as </span>
      <span>${negative_modifier}:</span>
      <span side>${side}</span>
      <span light> distributed </span>
      <span amount>${amount}</span>
    `
  }

  clamp(range, tool, increment = false) {
    if (increment) {
      if (this[tool] < range.length - 1)
        this[tool] = this[tool] + 1
    }
    else if (this[tool] > 0)
      this[tool] = this[tool] - 1

    return range[this[tool]]
  }
}

customElements.define('hotkeys-align', AlignHotkeys)
