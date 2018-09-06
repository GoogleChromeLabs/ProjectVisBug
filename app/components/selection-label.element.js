import $ from 'blingblingjs'

export default class SelectionLabel extends HTMLElement {
  
  constructor() {
    super()
    this.$shadow = this.attachShadow({mode: 'open'})
  }

  connectedCallback() {
    $('a', this.$shadow).on('click mouseenter', this.dispatchQuery.bind(this))
  }

  disconnectedCallback() {
    $('a', this.$shadow).off('click', this.dispatchQuery)
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
        :host > span {
          position: absolute;
          top: ${top + window.scrollY}px;
          left: ${left - 1}px;
          z-index: 10000;
          transform: translateY(-100%);
          background: hsla(330, 100%, 71%, 80%);
          color: white;
          display: inline-flex;
          justify-content: center;
          font-size: 0.8rem;
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

customElements.define('pb-label', SelectionLabel)