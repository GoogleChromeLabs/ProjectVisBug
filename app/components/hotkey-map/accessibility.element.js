import { HotkeyMap } from './base.element'
import { accessibility as icon } from '../vis-bug/vis-bug.icons'
import { altKey } from '../../utilities';

export class AccessibilityHotkeys extends HotkeyMap {
  constructor() {
    super()

    this._hotkey    = 'p'
    this._usedkeys  = [altKey]
    this.tool       = 'accessibility'
  }

  show() {
    this.$shadow.host.style.display = 'flex'
  }

  render() {
    return `
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
