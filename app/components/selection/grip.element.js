import { Handles } from './handles.element'
import { HandleStyles, GripStyles } from '../styles.store'

export class Grip extends Handles {

  constructor() {
    super()
    this.styles = [HandleStyles, GripStyles]
  }

  connectedCallback() {
    this.$shadow.adoptedStyleSheets = this.styles
  }

  toggleHovering({hovering}) {
    hovering
      ? this.$shadow.children[0].setAttribute('hovering', true)
      : this.$shadow.children[0].removeAttribute('hovering')
  }

  render({ width, height, top, left }) {
    this.style.setProperty('--top', `${top + window.scrollY}px`)
    this.style.setProperty('--left', `${left}px`)

    return `
      <svg width="${width}" height="${height}">
        <g>
          <rect></rect>
        </g>
      </svg>
    `
  }
}

customElements.define('visbug-grip', Grip)
