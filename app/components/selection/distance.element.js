import $ from 'blingblingjs'

export class Distance extends HTMLElement {
  
  constructor() {
    super()
    this.$shadow = this.attachShadow({mode: 'open'})
  }

  connectedCallback() {
    window.addEventListener('resize', this.on_resize.bind(this))
  }
  disconnectedCallback() {
    window.removeEventListener('resize', this.on_resize)
  }

  on_resize() {
    window.requestAnimationFrame(() => {
      const node_label_id = this.$shadow.host.getAttribute('data-label-id')
      const [source_el] = $(`[data-label-id="${node_label_id}"]`)

      this.position = {
        node_label_id,
        boundingRect: source_el.getBoundingClientRect(),
      }
    })
  }

  set position({boundingRect, node_label_id}) {
    this.$shadow.innerHTML  = this.render(boundingRect, node_label_id)
  }

  render({ x, y, width, height, top, left }, node_label_id) {
    this.$shadow.host.setAttribute('data-label-id', node_label_id)
    return `
      ${this.styles({top,left})}
      <svg 
        class="pb-distance"
        width="${width}" height="${height}" 
        viewBox="0 0 ${width} ${height}" 
        version="1.1" xmlns="http://www.w3.org/2000/svg"
      >
        <rect stroke="hotpink" fill="none" width="100%" height="100%"></rect>
      </svg>
    `
  }

  styles({top,left}) {
    return `
      <style>
        :host > svg {
          position: absolute;
          top: ${top + window.scrollY}px;
          left: ${left}px;
          overflow: visible;
          pointer-events: none;
          z-index: 10010;
        }
      </style>
    `
  }
}

customElements.define('pb-distance', Distance)