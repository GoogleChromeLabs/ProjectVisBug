import { DistanceStyles } from '../styles.store'

export class Distance extends HTMLElement {

  constructor() {
    super()
    this.$shadow = this.attachShadow({mode: 'open'})
  }

  connectedCallback() {
    this.$shadow.adoptedStyleSheets = [DistanceStyles]
  }
  
  disconnectedCallback() {
    if (this.hasAttribute('popover'))
      this.hidePopover && this.hidePopover()
  }

  set position({line_model, node_label_id}) {
    this.styleProps = line_model
    this.$shadow.innerHTML  = this.render(line_model, node_label_id)
  }

  set styleProps({y,x,d,q,v = false, color, local = false, length = d, angle = 0, centered = false}) {
    this.style.setProperty('--top', `${Math.round(y + (local ? 0 : window.scrollY))}px`)
    this.style.setProperty('--right', 'auto')
    this.style.setProperty('--left', `${x}px`)
    this.style.setProperty('--direction', v ? 'column' : 'row')
    this.style.setProperty('--quadrant', q)
    this.style.setProperty('--angle', `${angle}rad`)
    this.style.setProperty('--caption-angle', `${angle * -1}rad`)

    if (centered)
      this.style.setProperty('--justify', 'center')
    else if (q === 'left')
      this.style.setProperty('--justify', 'flex-end')

    v
      ? this.style.setProperty('--distance-h', `${length}px`)
      : this.style.setProperty('--distance-w', `${length}px`)

     v
      ? this.style.setProperty('--line-h', `var(--line-w)`)
      : this.style.setProperty('--line-w', `var(--line-w)`)

    this.style.setProperty('--line-color', color === 'pink'
      ? '1 0 1'
      : '.5 0 1')
    this.style.setProperty('--line-base', color === 'pink'
      ? '1 0 1'
      : '.5 0 1')
  }

  render({q,d}, node_label_id) {
    this.$shadow.host.setAttribute('data-label-id', node_label_id)

    return `
      <figure quadrant="${q}">
        <div></div>
        <figcaption>${Math.round(d)}</figcaption>
        <div></div>
      </figure>
    `
  }

  isPopover() {
    this.setAttribute('popover', 'manual')
    this.showPopover && this.showPopover()
  }
}

customElements.define('visbug-distance', Distance)
