import { HotkeyMap } from './base.element'
import { inspector as icon } from '../tool-pallete/toolpallete.icons' 

export class BoxshadowHotkeys extends HotkeyMap {
  constructor() {
    super()

    this._hotkey    = 'd'
    this._usedkeys  = ['shift','cmd']
    this.tool       = 'boxshadow'
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

customElements.define('hotkeys-boxshadow', BoxshadowHotkeys)