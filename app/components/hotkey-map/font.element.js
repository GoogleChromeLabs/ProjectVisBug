import { HotkeyMap } from './base.element'
import { inspector as icon } from '../tool-pallete/toolpallete.icons' 

export class FontHotkeys extends HotkeyMap {
  constructor() {
    super()

    this._hotkey    = 'f'
    this._usedkeys  = ['shift','cmd']
    this.tool       = 'font'
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

customElements.define('hotkeys-font', FontHotkeys)