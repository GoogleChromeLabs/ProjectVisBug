import { windowBounds } from '../../utilities/'

export class Gridlines extends HTMLElement {

  constructor() {
    super()
    this.$shadow = this.attachShadow({mode: 'closed'})
  }

  connectedCallback() {}
  disconnectedCallback() {}

  set position(boundingRect) {
    this.$shadow.innerHTML  = this.render(boundingRect)
  }

  set update({ width, height, top, left }) {
    const { winWidth, winHeight } = windowBounds()

    this.$shadow.host.style.display = 'block'
    const svg = this.$shadow.children[1]

    svg.setAttribute('viewBox', `0 0 ${winWidth} ${winHeight}`)
    svg.children[0].setAttribute('width', width + 'px')
    svg.children[0].setAttribute('height', height + 'px')
    svg.children[0].setAttribute('x', left)
    svg.children[0].setAttribute('y', top)
    svg.children[1].setAttribute('x1', left)
    svg.children[1].setAttribute('x2', left)
    svg.children[2].setAttribute('x1', left + width)
    svg.children[2].setAttribute('x2', left + width)
    svg.children[3].setAttribute('y1', top + window.scrollY)
    svg.children[3].setAttribute('y2', top + window.scrollY)
    svg.children[3].setAttribute('x2', winWidth)
    svg.children[4].setAttribute('y1', top + window.scrollY + height)
    svg.children[4].setAttribute('y2', top + window.scrollY + height)
    svg.children[4].setAttribute('x2', winWidth)
  }

  render({ x, y, width, height, top, left }) {
    const { winWidth, winHeight } = windowBounds()
    const { offsetHeight } = document.body
    const calced_y = y + window.scrollY

    return `
      ${this.styles()}
      <svg
        width="100%" height="100%"
        viewBox="0 0 ${winWidth} ${winHeight}"
        version="1.1" xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          fill="none"
          width="${width}" height="${height}"
          x="${x}" y="${y}"
          style="display:none;"
        ></rect>
        <line x1="${x}" y1="0" x2="${x}" y2="${offsetHeight}"></line>
        <line x1="${x + width}" y1="0" x2="${x + width}" y2="${offsetHeight}"></line>
        <line x1="0" y1="${calced_y}" x2="${winWidth}" y2="${calced_y}"></line>
        <line x1="0" y1="${calced_y + height}" x2="${winWidth}" y2="${calced_y + height}"></line>
      </svg>
    `
  }

  styles() {
    return `
      <style>
        :host {
          --color: hotpink;
        }

        :host > svg {
          position:absolute;
          top:0;
          left:0;
          overflow:visible;
          pointer-events:none;
          z-index:2147483642;
        }

        :host rect, :host line {
          stroke: var(--color);
        }

        :host line {
          stroke-dasharray: 2;
          stroke-dasharray-offset: 3;
        }
      </style>
    `
  }
}

customElements.define('visbug-gridlines', Gridlines)
