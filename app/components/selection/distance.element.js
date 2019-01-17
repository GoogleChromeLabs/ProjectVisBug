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

  render(measurements, node_label_id) {
    this.$shadow.host.setAttribute('data-label-id', node_label_id)
    return `
      ${this.styles(measurements)}
      <figure quadrant="measurements.q">
        <div></div>
        <figcaption><b>${measurements.d}</b>px</figcaption>
        <div></div>
      </figure>
    `
  }

  styles({y,x,d,q,v = false}) {
    return `
      <style>
        :host {
          --line-color: hsl(267, 100%, 58%);
          --line-width: 1px;
          font-size: 16px;
        }

        :host > figure {
          margin: 0;
          position: absolute;
          ${v
            ? `height: ${d}px; width: 5px;`
            : `width: ${d}px; height: 5px;`}
          top: ${y + window.scrollY}px;
          left: ${x}px;
          transform: ${v
            ? 'translateX(-50%)'
            : 'translateY(-50%)'};
          overflow: visible;
          pointer-events: none;
          z-index: 10010;

          display: flex;
          align-items: center;
          flex-direction: ${v ? 'column' : 'row'};
        }

        :host > figure figcaption {
          color: hotpink;
          text-shadow: 0 0.5px 0 hsla(0, 0%, 0%, 25%);
          text-align: center;
          line-height: 0.9;
          font-size: 0.6em;
          padding: 1px;
        }

        :host > figure span {
          background: var(--line-color);
          ${v
            ? 'height: var(--line-width); width: 5px;'
            : 'width: var(--line-width); height: 5px;'}
        }

        :host > figure div {
          flex: 2;
          background: var(--line-color);
          ${v
            ? 'width: var(--line-width);'
            : 'height: var(--line-width);'}
        }

        :host figure > div${q === 'top' || q === 'left' ? ':last-of-type' : ':first-of-type'} {
          background: linear-gradient(to ${q}, hotpink 0%, var(--line-color) 100%);
        }
      </style>
    `
  }
}

customElements.define('pb-distance', Distance)