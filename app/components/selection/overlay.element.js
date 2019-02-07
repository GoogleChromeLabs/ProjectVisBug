export class Overlay extends HTMLElement {
  
  constructor() {
    super()
    this.$shadow = this.attachShadow({mode: 'closed'})
  }

  connectedCallback() {}
  disconnectedCallback() {}

  set position(boundingRect) {
    this.$shadow.innerHTML  = this.render(boundingRect)
  }

  set update({ top, left, width, height }) {
    this.$shadow.host.style.display = 'block'

    const svg = this.$shadow.children[0]
    svg.style.display = 'block'
    svg.style.top = window.scrollY + top + 'px'
    svg.style.left = left + 'px'

    svg.setAttribute('width', width + 'px')
    svg.setAttribute('height', height + 'px')
  }

  render({id, top, left, height, width}) {
    return `
      <svg 
        class="visbug-overlay"
        overlay-id="${id}"
        style="
          display:none;
          position:absolute;
          top:0;
          left:0;
          overflow:visible;
          pointer-events:none;
          z-index: 999;
        " 
        width="${width}px" height="${height}px" 
        viewBox="0 0 ${width} ${height}" 
        version="1.1" xmlns="http://www.w3.org/2000/svg"
      >
        <rect 
          fill="hsla(330, 100%, 71%, 0.5)"
          width="100%" height="100%"
        ></rect>
      </svg>
    `
  }
}

customElements.define('visbug-overlay', Overlay)
