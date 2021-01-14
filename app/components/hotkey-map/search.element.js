import { HotkeyMap } from './base.element'
import { search as icon } from '../vis-bug/vis-bug.icons'

export class SearchHotkeys extends HotkeyMap {
  constructor() {
    super()

    this._hotkey    = 's'
    this._usedkeys  = []
    this.tool       = 'search'
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

customElements.define('hotkeys-search', SearchHotkeys)
