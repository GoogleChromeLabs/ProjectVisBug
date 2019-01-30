import $ from 'blingblingjs'
import { Handles } from './handles.element'

export class Hover extends Handles {

  constructor() {
    super()
  }

  render({ x, y, width, height, top, left }) {
    return `
      ${this.styles({top,left})}
      <style>
        :host rect {
          width: 100%;
          height: 100%;
          vector-effect: non-scaling-stroke;
          stroke: hsl(267, 100%, 58%);
          stroke-width: 1px;
          fill: none;
        }
      </style>
      <svg width="${width}" height="${height}">
        <rect></rect>
      </svg>
    `
  }
}

customElements.define('pb-hover', Hover)
