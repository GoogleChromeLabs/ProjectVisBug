import { HotkeyMap } from './base.element'
import { text as icon } from '../vis-bug/vis-bug.icons'

export class TextHotkeys extends HotkeyMap {
  constructor() {
    super()

    this._hotkey    = 'e'
    this._usedkeys  = []
    this.tool       = 'text'
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

customElements.define('hotkeys-text', TextHotkeys)
