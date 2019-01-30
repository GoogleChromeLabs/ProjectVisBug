import $ from 'blingblingjs'
import { Handles } from './handles.element'

export class Hover extends Handles {

  constructor() {
    super()
  }

  render({ x, y, width, height, top, left }) {
    return `
      ${this.styles({top,left})}
      <svg
        class="pb-hover"
        width="${width}" height="${height}"
        viewBox="0 0 ${width} ${height}"
        version="1.1" xmlns="http://www.w3.org/2000/svg"
      >
        <rect stroke-width="1px" stroke="hsl(267, 100%, 58%)" fill="none" width="100%" height="100%"></rect>
      </svg>
    `
  }
}

customElements.define('pb-hover', Hover)
