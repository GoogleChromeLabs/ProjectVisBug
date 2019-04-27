import { Handles } from './handles.element'
import { HandleStyles, HoverStyles } from '../styles.store'

export class Hover extends Handles {

  constructor() {
    super()
    this.styles = [HandleStyles, HoverStyles]
  }

  render({ width, height, top, left }) {
    this.style.setProperty('--top', `${top + window.scrollY}px`)
    this.style.setProperty('--left', `${left}px`)

    return `
      <svg width="${width}" height="${height}">
        <rect></rect>
      </svg>
    `
  }
}

customElements.define('visbug-hover', Hover)
