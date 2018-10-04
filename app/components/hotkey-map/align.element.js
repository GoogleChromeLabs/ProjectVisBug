import { HotkeyMap } from './base.element'

const h_alignOptions  = ['left','center','right']
const v_alignOptions  = ['top','center','bottom']

export class AlignHotkeys extends HotkeyMap {
  constructor() {
    super()

    this._hotkey  = 'a'
    this._htool   = 0
    this._vtool   = 0
    this.tool     = 'align'
  }

  createCommand({e, hotkeys}) {
    let amount, negative, negative_modifier, side

    if (e.code === 'ArrowUp')           side = this.clamp(v_alignOptions, '_vtool')
    else if (e.code === 'ArrowDown')    side = this.clamp(v_alignOptions, '_vtool', true)
    else                                side = v_alignOptions[this._vtool]

    if (e.code === 'ArrowLeft')         side += ' ' + this.clamp(h_alignOptions, '_htool')
    else if (e.code === 'ArrowRight')   side += ' ' + this.clamp(h_alignOptions, '_htool', true)
    else                                side += ' ' + h_alignOptions[this._htool]

    return {
      negative, negative_modifier, amount, side,
    }
  }

  displayCommand({side}) {
    return `
      <span tool>${this._tool}</span>
      <span side>${side}</span>
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