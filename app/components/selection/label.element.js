import $ from 'blingblingjs'
import { LabelStyles } from '../styles.store'
import { isFixed } from '../../utilities/';

export class Label extends HTMLElement {

  constructor() {
    super()
    this.$shadow = this.attachShadow({mode: 'closed'})
    this.on_resize = this.on_resize.bind(this)
    this.dispatchQuery = this.dispatchQuery.bind(this)
  }

  connectedCallback() {
    this.$shadow.adoptedStyleSheets = [LabelStyles]
    $('a', this.$shadow).on('click mouseenter', this.dispatchQuery)
    window.addEventListener('resize', this.on_resize)
  }

  disconnectedCallback() {
    $('a', this.$shadow).off('click mouseenter', this.dispatchQuery)
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
        isFixed: isFixed(source_el),
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
    this.$shadow.childElementCount
      ? this.$shadow.firstElementChild.innerHTML = content
      : this._text = content
  }

  set position({boundingRect, node_label_id, isFixed}) {
    this.$shadow.innerHTML = this.render(node_label_id)
    this.update = {boundingRect, isFixed}
  }

  set update({boundingRect, isFixed}) {
    this.style.setProperty('--top', `${boundingRect.y + (isFixed ? 0 : window.scrollY)}px`)
    this.style.setProperty('--left', `${boundingRect.x - 1}px`)
    this.style.setProperty('--max-width', `${boundingRect.width + (window.innerWidth - boundingRect.x - boundingRect.width - 20)}px`)
    this.style.setProperty('--position', isFixed ? 'fixed' : 'absolute');
  }

  render(node_label_id) {
    this.$shadow.host.setAttribute('data-label-id', node_label_id)

    return `<span>${this._text}</span>`
  }
}

customElements.define('visbug-label', Label)
