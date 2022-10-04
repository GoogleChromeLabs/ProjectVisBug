import { Handles } from './handles.element'
import { HandlesStyles, GripStyles } from '../styles.store'
import { isFixed } from '../../utilities/';

export class Grip extends Handles {

  constructor() {
    super()
    this.styles = [HandlesStyles, GripStyles]
  }

  toggleHovering({hovering}) {
    hovering
      ? this.$shadow.children[0].setAttribute('hovering', true)
      : this.$shadow.children[0].removeAttribute('hovering')
  }

  render({ width, height, top, left }) {
    this.style.setProperty('--position', isFixed(this.$shadow.host) ? 'fixed' : 'absolute')
    this.style.setProperty('--top', `${top + window.scrollY}px`)
    this.style.setProperty('--left', `${left}px`)

    return `
      <svg width="${width}" height="${height}">
        <pattern id="stripes" patternUnits="userSpaceOnUse" width="4" height="4">
          <line x="0" y1="0" x2="0" y2="4" style="stroke:hsla(330, 100%, 71%, 50%); stroke-width: 3;" />
        </pattern>
        <g>
          <rect fill="url(#stripes)" />
        </g>
      </svg>
    `
  }
}

customElements.define('visbug-grip', Grip)
