import { Handles } from './handles.element'
import { HandleStyles, HoverStyles } from '../styles.store'

export class Hover extends Handles {

  constructor() {
    super()
    this.styles = [HandleStyles, HoverStyles]
  }

  render({ width, height, top, left }, node_label_id, isFixed) {
    this.style.setProperty('--top', `${top + (isFixed ? 0 : window.scrollY)}px`)
    this.style.setProperty('--left', `${left}px`)
    this.style.setProperty('--position', isFixed ? 'fixed' : 'absolute')

    return `
      <svg width="${width}" height="${height}">
        <rect></rect>
      </svg>
    `
  }
}

customElements.define('visbug-hover', Hover)
