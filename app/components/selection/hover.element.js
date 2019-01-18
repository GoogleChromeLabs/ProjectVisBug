import $ from 'blingblingjs'
import { Handles } from './handles.element'

export class Hovers extends Handles {

  constructor() {
    super()
  }

  render({ x, y, width, height, top, left }, node_label_id) {
    this.$shadow.host.setAttribute('data-label-id', node_label_id)
    return `
      ${this.styles({top,left})}
      <svg
        class="pb-hovers"
        width="${width}" height="${height}"
        viewBox="0 0 ${width} ${height}"
        version="1.1" xmlns="http://www.w3.org/2000/svg"
      >
        <rect stroke-width="0.5px" stroke="hsl(267, 100%, 58%)" fill="none" width="100%" height="100%"></rect>
      </svg>
    `
  }
}

customElements.define('pb-hovers', Hovers)
