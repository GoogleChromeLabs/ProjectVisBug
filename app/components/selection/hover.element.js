import { Handles } from './handles.element'
import { HandlesStyles, HoverStyles } from '../styles.store'
import { quadBounds, quadPath } from './quad'

export class Hover extends Handles {

  constructor() {
    super()
    this.styles = [HandlesStyles, HoverStyles]
  }

  connectedCallback() {
    this.$shadow.adoptedStyleSheets = this.styles
  }

  disconnectedCallback() {}

  render(quad, node_label_id, isFixed) {
    const {width, height, top, left} = quadBounds(quad)

    this.style.setProperty('--top', `${top + (isFixed ? 0 : window.scrollY)}px`)
    this.style.setProperty('--left', `${left + (isFixed ? 0 : window.scrollX)}px`)
    this.style.setProperty('--position', isFixed ? 'fixed' : 'absolute')
    this.style.setProperty('--width', `${width}px`)
    this.style.setProperty('--height', `${height}px`)

    return `
      <svg
        width="${width}" height="${height}"
        viewBox="0 0 ${width} ${height}"
      >
        <path d="${quadPath(quad, {x: left, y: top})}" fill="none"></path>
      </svg>
    `
  }
}

customElements.define('visbug-hover', Hover)
