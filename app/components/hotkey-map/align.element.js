import { HotkeyMap } from './base.element'

const h_alignOptions  = ['left','center','right']
const v_alignOptions  = ['top','center','bottom']
const distOptions     = ['evenly','normal','between']

export class AlignHotkeys extends HotkeyMap {
  constructor() {
    super()

    this._hotkey   = 'a'
    this._usedkeys = ['cmd','shift']

    this._htool   = 0
    this._vtool   = 0
    this._dtool   = 1

    this._side         = 'top left'
    this._direction    = 'row'
    this._distribution = distOptions[this._dtool]

    this.tool     = 'align'
  }

  createCommand({e, hotkeys}) {
    let amount            = this._distribution
      , negative_modifier = this._direction
      , side              = this._side
      , negative

    if (hotkeys.cmd && (e.code === 'ArrowRight' || e.code === 'ArrowDown')) {
      negative_modifier = e.code === 'ArrowDown'
        ? 'column'
        : 'row'
      this._direction = negative_modifier
    }
    else {
      if (e.code === 'ArrowUp')           side = this.clamp(v_alignOptions, '_vtool')
      else if (e.code === 'ArrowDown')    side = this.clamp(v_alignOptions, '_vtool', true)
      else                                side = v_alignOptions[this._vtool]

      if (e.code === 'ArrowLeft')         side += ' ' + this.clamp(h_alignOptions, '_htool')
      else if (e.code === 'ArrowRight')   side += ' ' + this.clamp(h_alignOptions, '_htool', true)
      else                                side += ' ' + h_alignOptions[this._htool]

      this._side = side

      if (hotkeys.shift && (e.code === 'ArrowRight' || e.code === 'ArrowLeft')) {
        amount = this.clamp(distOptions, '_dtool', e.code === 'ArrowRight')
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