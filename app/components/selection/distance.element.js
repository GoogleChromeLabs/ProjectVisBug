import { DistanceStyles } from '../styles.store'

export class Distance extends HTMLElement {

  constructor() {
    super()
    this.$shadow = this.attachShadow({mode: 'open'})
    this.$shadow.adoptedStyleSheets = [DistanceStyles]
  }

  connectedCallback() {}
  disconnectedCallback() {}

  set position({line_model, node_label_id}) {
    this.styleProps = line_model
    this.$shadow.innerHTML  = this.render(line_model, node_label_id)
  }

  set styleProps({y,x,d,q,v = false}) {
    this.style.setProperty('--top', `${y + window.scrollY}px`)
    this.style.setProperty('--left', `${x}px`)
    this.style.setProperty('--direction', v ? 'column' : 'row')
    this.style.setProperty('--quadrant', q)

    v
      ? this.style.setProperty('--distance-h', `${d}px`)
      : this.style.setProperty('--distance-w', `${d}px`)

     v
      ? this.style.setProperty('--line-h', `var(--line-w)`)
      : this.style.setProperty('--line-w', `var(--line-w)`)

    this.style.setProperty('--translate', v
      ? 'translateX(-50%)'
      : 'translateY(-50%)')
  }

  render({q,d}, node_label_id) {
    this.$shadow.host.setAttribute('data-label-id', node_label_id)

    return `
      <figure quadrant="${q}">
        <div></div>
        <figcaption><b>${d}</b>px</figcaption>
        <div></div>
      </figure>
    `
  }
}

customElements.define('visbug-distance', Distance)
