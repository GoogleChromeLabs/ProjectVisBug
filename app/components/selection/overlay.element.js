import { OverlayStyles } from '../styles.store'

export class Overlay extends HTMLElement {

  constructor() {
    super()
    this.$shadow = this.attachShadow({mode: 'closed'})
  }

  connectedCallback() {
    this.$shadow.adoptedStyleSheets = [OverlayStyles]
  }
  
  disconnectedCallback() {}

  set position(boundingRect) {
    this.$shadow.innerHTML = this.render(boundingRect)
  }

  set update({ top, left, width, height }) {
    const [svg] = this.$shadow.children

    this.$shadow.host.style.display = 'block'
    svg.style.display = 'block'

    this.style.setProperty('--top', `${top + window.scrollY}px`)
    this.style.setProperty('--left', `${left + window.scrollX - 1}px`)

    svg.setAttribute('width', width + 'px')
    svg.setAttribute('height', height + 'px')
  }

  render({height, width}) {
    return `
      <svg class="visbug-overlay"
        width="${width}px" height="${height}px"
        viewBox="0 0 ${width} ${height}"
      >
        <rect></rect>
      </svg>
    `
  }
}

customElements.define('visbug-overlay', Overlay)
