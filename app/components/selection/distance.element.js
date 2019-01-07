export class Distance extends HTMLElement {
  
  constructor() {
    super()
    this.$shadow = this.attachShadow({mode: 'open'})
  }

  connectedCallback() {}
  disconnectedCallback() {}

  set position({line_model, node_label_id}) {
    this.$shadow.innerHTML  = this.render(line_model, node_label_id)
  }

  render({ x, y, width }, node_label_id) {
    this.$shadow.host.setAttribute('data-label-id', node_label_id)
    return `
      ${this.styles({y,x,width})}
      <figure>
        <figcaption>${width}px</figcaption>
        <span></span>
        <div></div>
        <span></span>
      </figure>
    `
  }

  styles({y,x,width}) {
    return `
      <style>
        :host {
          --line-color: hsl(267, 100%, 58%);
          --line-width: 1px;

          display: grid;
          grid-template-rows: auto auto;
          align-items: center;
          justify-content: center;
          font-size: 16px;
        }

        :host > figure {
          margin: 0;
          position: absolute;
          width: ${width}px;
          top: ${y - 21 + window.scrollY}px;
          left: ${x}px;
          overflow: visible;
          pointer-events: none;
          z-index: 10010;

          display: grid;
          grid-template-columns: auto 1fr auto;
          grid-template-rows: auto 0.75em;
          align-items: center;
        }

        :host > figure figcaption {
          grid-column: 1/4;
          color: hotpink;
          text-align: center;
          font-size: 0.75em;
        }

        :host > figure span {
          background: var(--line-color);
          height: 100%;
          width: var(--line-width);
        }

        :host > figure div {
          background: var(--line-color);
          height: var(--line-width);
        }
      </style>
    `
  }
}

customElements.define('pb-distance', Distance)