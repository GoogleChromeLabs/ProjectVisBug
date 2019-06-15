import { HotkeyMap } from './base.element'
import { guides as icon } from '../vis-bug/vis-bug.icons'

export class GuidesHotkeys extends HotkeyMap {
  constructor() {
    super()

    this._hotkey    = 'g'
    this._usedkeys  = []
    this.tool       = 'guides'
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

customElements.define('hotkeys-guides', GuidesHotkeys)
