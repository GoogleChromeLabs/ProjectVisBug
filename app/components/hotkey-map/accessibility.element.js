import { HotkeyMap } from './base.element'
import { inspector as icon } from '../tool-pallete/toolpallete.icons' 

export class AccessibilityHotkeys extends HotkeyMap {
  constructor() {
    super()

    this._hotkey    = 'p'
    this._usedkeys  = ['alt']
    this.tool       = 'accessibility'
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

customElements.define('hotkeys-accessibility', AccessibilityHotkeys)