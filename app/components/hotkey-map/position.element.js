import { HotkeyMap } from './base.element'
import { position as icon } from '../tool-pallete/toolpallete.icons'
import { altKey } from '../../utilities';

export class PositionHotkeys extends HotkeyMap {
  constructor() {
    super()

    this._hotkey    = 'l'
    this._usedkeys  = ['shift',altKey]
    this.tool       = 'position'
  }

  connectedCallback() {}

  show() {
    this.$shadow.host.style.display = 'flex'
  }

  render() {
    return `
      ${this.styles()}
      <article>
        <div tool-icon>
          <span>
            ${icon}
            ${this._tool} Tool
          </span>
        </div>
        <div command>
          coming soon
        </div>
      </article>
    `
  }
}

customElements.define('hotkeys-position', PositionHotkeys)
