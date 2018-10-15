import { HotkeyMap } from './base.element'

export class MoveHotkeys extends HotkeyMap {
  constructor() {
    super()

    this._hotkey  = 'v'
    this.tool     = 'move'
  }

  createCommand({e:{code}, hotkeys}) {
    let amount, negative, negative_modifier

    let side = '[arrow key]'
    if (code === 'ArrowUp')     side = 'up & out of div'
    if (code === 'ArrowDown')   side = 'down & into next sibling / out & under div'
    if (code === 'ArrowLeft')   side = 'towards the front/top of the stack'
    if (code === 'ArrowRight')  side = 'towards the back/bottom of the stack'

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