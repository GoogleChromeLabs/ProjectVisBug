import { HotkeyMap } from './base.element'
import { hueshift as icon } from '../tool-pallete/toolpallete.icons' 

export class HueshiftHotkeys extends HotkeyMap {
  constructor() {
    super()

    this._hotkey    = 'h'
    this._usedkeys  = ['shift','cmd']
    this.tool       = 'hueshift'
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

customElements.define('hotkeys-hueshift', HueshiftHotkeys)