import $ from 'blingblingjs'
import { LabelStyles } from '../styles.store'

export class Label extends HTMLElement {

  constructor() {
    super()
    this.$shadow = this.attachShadow({mode: 'closed'})
    this.$shadow.adoptedStyleSheets = [LabelStyles]
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
      const [source_el]   = $(`[data-label-id="${node_label_id}"]`)

      if (!source_el) return

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
    this.$shadow.innerHTML = this.render(node_label_id)
    this.update = boundingRect
  }

  set update({x,y,width}) {
    this.style.setProperty('--top', `${y + window.scrollY}px`)
    this.style.setProperty('--left', `${x - 1}px`)
    this.style.setProperty('--max-width', `${width + (window.innerWidth - x - width - 20)}px`)
  }

  render(node_label_id) {
    this.$shadow.host.setAttribute('data-label-id', node_label_id)

    return `<span>${this._text}</span>`
  }
}

customElements.define('visbug-label', Label)
