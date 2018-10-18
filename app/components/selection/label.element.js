import $ from 'blingblingjs'

export class Label extends HTMLElement {
  
  constructor() {
    super()
    this.$shadow = this.attachShadow({mode: 'open'})
  }

  connectedCallback() {
    $('a', this.$shadow).on('click mouseenter', this.dispatchQuery.bind(this))
    window.addEventListener('resize', this.on_resize.bind(this))
  }

  disconnectedCallback() {
    $('a', this.$shadow).off('click', this.dispatchQuery)
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

  dispatchQuery(e) {
    this.$shadow.host.dispatchEvent(new CustomEvent('query', {
      bubbles: true,
      detail:   {
        text:       e.target.textContent,
        activator:  e.type,
      }
    }))
  }

  set text(content) {
    this._text = content
  }

  set position({boundingRect, node_label_id}) {
    this.$shadow.innerHTML  = this.render(boundingRect, node_label_id)
  }

  set update({x,y}) {
    const label = this.$shadow.children[1]
    label.style.top  = y + window.scrollY + 'px'
    label.style.left = x - 1 + 'px'
  }

  render({ x, y, width, height, top, left }, node_label_id) {
    this.$shadow.host.setAttribute('data-label-id', node_label_id)

    return `
      ${this.styles({top,left})}
      <span>
        ${this._text}
      </span>
    `
  }

  styles({top,left}) {
    return `
      <style>
        :host {
          font-size: 16px;
        }

        :host > span {
          position: absolute;
          top: ${top + window.scrollY}px;
          left: ${left - 1}px;
          z-index: 10000;
          transform: translateY(-100%);
          background: hsl(330, 100%, 71%);
          text-shadow: 0 1px 0 hsl(330, 100%, 61%);
          color: white;
          display: inline-flex;
          justify-content: center;
          font-size: 0.8em;
          font-weight: normal;
          font-family: sans-serif;
          padding: 0.25em 0.4em 0.15em;
          line-height: 1.1;
        }

        :host a {
          text-decoration: none;
          color: inherit;
          cursor: pointer;
        }

        :host a:hover {
          text-decoration: underline;
          color: white;
        }
      </style>
    `
  }
}

customElements.define('pb-label', Label)