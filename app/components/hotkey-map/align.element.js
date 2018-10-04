import { HotkeyMap } from './base.element'

export class AlignHotkeys extends HotkeyMap {
  constructor() {
    super()

    this._hotkey  = 'a'
    this.tool     = 'align'
  }

  createCommand({e, hotkeys}) {
    let amount, negative, negative_modifier

    let side = '[arrow key]'
    if (e.code === 'ArrowUp')     side = 'up/out'
    if (e.code === 'ArrowDown')   side = 'in/under'
    if (e.code === 'ArrowLeft')   side = 'left'
    if (e.code === 'ArrowRight')  side = 'right'

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
}

customElements.define('hotkeys-align', AlignHotkeys)