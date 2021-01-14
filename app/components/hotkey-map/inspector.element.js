import { HotkeyMap } from './base.element'
import { inspector as icon } from '../vis-bug/vis-bug.icons'
import { altKey } from '../../utilities';

export class InspectorHotkeys extends HotkeyMap {
  constructor() {
    super()

    this._hotkey    = 'i'
    this._usedkeys  = [altKey]
    this.tool       = 'inspector'
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

customElements.define('hotkeys-inspector', InspectorHotkeys)
