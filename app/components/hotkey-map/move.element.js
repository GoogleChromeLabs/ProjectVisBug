import { HotkeyMap } from './base.element'

export class MoveHotkeys extends HotkeyMap {
  constructor() {
    super()

    this._hotkey  = 'v'
    this.tool     = 'move'
  }

  createCommand({e, hotkeys}) {
    const amount              = hotkeys.shift ? 10 : 1
    const negative            = hotkeys.alt ? 'Subtract' : 'Add'
    const negative_modifier   = hotkeys.alt ? 'from' : 'to'

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

customElements.define('hotkeys-move', MoveHotkeys)