import { Handles } from './handles.element'
import { HandlesStyles, CornerStyles } from '../styles.store'

export class Corners extends Handles {

  constructor() {
    super()
    this.styles = [HandlesStyles, CornerStyles]
  }

  render({ width, height, top, left }) {
    this.style.setProperty('--top', `${top + window.scrollY}px`)
    this.style.setProperty('--left', `${left}px`)

    return `
      <svg width="${width}" height="${height}">
        <rect></rect>
        <rect></rect>
        <rect></rect>
        <rect></rect>
      </svg>
    `
  }
}

customElements.define('visbug-corners', Corners)
