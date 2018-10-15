import { HotkeyMap } from './base.element'
import { inspector as icon } from '../tool-pallete/toolpallete.icons' 

export class InspectorHotkeys extends HotkeyMap {
  constructor() {
    super()

    this._hotkey    = 'i'
    this._usedkeys  = ['alt']
    this.tool       = 'inspector'
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

customElements.define('hotkeys-inspector', InspectorHotkeys)