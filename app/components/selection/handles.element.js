import $ from 'blingblingjs'
import { HandlesStyles } from '../styles.store'
import { isFixed } from '../../utilities/';

export class Handles extends HTMLElement {

  constructor() {
    super()
    this.$shadow = this.attachShadow({mode: 'closed'})
    this.styles = [HandlesStyles]
    this.on_resize = this.on_window_resize.bind(this)
  }

  connectedCallback() {
    this.$shadow.adoptedStyleSheets = this.styles
    this.setAttribute('popover', 'manual')
    this.showPopover && this.showPopover()
    window.addEventListener('resize', this.on_window_resize)
  }

  disconnectedCallback() {
    if (this.hidePopover && this.hidePopover()) this.hidePopover && this.hidePopover()
    window.removeEventListener('resize', this.on_window_resize)
  }

  on_window_resize() {
    if (!this.$shadow) return
    window.requestAnimationFrame(() => {
      const node_label_id = this.$shadow.host.getAttribute('data-label-id')
      const [source_el] = $(`[data-label-id="${node_label_id}"]`)

      if (!source_el) return

      this.position = {
        node_label_id,
        el: source_el,
        isFixed: isFixed(source_el),
      }
    })
  }

  set position({el, node_label_id}) {
    this.$shadow.innerHTML = this.render(el.getBoxQuads()[0], node_label_id, isFixed(el))

    if (this._backdrop) {
      this.backdrop = {
        element: this._backdrop.update(el),
        update:  this._backdrop.update,
      }
    }
  }

  set backdrop(bd) {
    this._backdrop = bd

    const cur_child = this.$shadow.querySelector('visbug-boxmodel')

    cur_child
      ? this.$shadow.replaceChild(bd.element, cur_child)
      : this.$shadow.appendChild(bd.element)
  }

  /**
   *
   * @param {DOMQuad} quad
   * @param {string} node_label_id
   * @param {boolean} isFixed
   * @returns
   */
  render(quad, node_label_id, isFixed) {
    this.$shadow.host.setAttribute('data-label-id', node_label_id)

    const left = Math.min(quad.p1.x,quad.p2.x,quad.p3.x,quad.p4.x);
    const right = Math.max(quad.p1.x,quad.p2.x,quad.p3.x,quad.p4.x);
    const top = Math.min(quad.p1.y,quad.p2.y,quad.p3.y,quad.p4.y);
    const bottom = Math.max(quad.p1.y,quad.p2.y,quad.p3.y,quad.p4.y);
    const width = right - left;
    const height = bottom - top;

    this.style.setProperty('--top', `${top + (isFixed ? 0 : window.scrollY)}px`)
    this.style.setProperty('--left', `${left}px`)
    this.style.setProperty('--position', isFixed ? 'fixed' : 'absolute')
    this.style.setProperty('--width', `${width}px`)
    this.style.setProperty('--height', `${height}px`)

    return `
      <svg
        class="visbug-handles"
        width="${width}" height="${height}"
        viewBox="0 0 ${width} ${height}"
        version="1.1" xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M${quad.p1.x - left},${quad.p1.y - top} ${quad.p2.x - left},${quad.p2.y - top} ${quad.p3.x - left},${quad.p3.y - top} ${quad.p4.x - left},${quad.p4.y - top}Z" stroke="var(--neon-pink)" fill="none"></path>
      </svg>
      <visbug-handle style="position:absolute; left: ${quad.p1.x - left}px; top: ${quad.p1.y - top}px;" placement="top-start"></visbug-handle>
      <visbug-handle style="position:absolute; left: ${quad.p1.x + (quad.p2.x - quad.p1.x) / 2 - left}px; top: ${quad.p1.y + (quad.p2.y - quad.p1.y) / 2 - top}px;" placement="top-center"></visbug-handle>
      <visbug-handle style="position:absolute; left: ${quad.p2.x - left}px; top: ${quad.p2.y - top}px;" placement="top-end"></visbug-handle>
      <visbug-handle style="position:absolute; left: ${quad.p1.x + (quad.p4.x - quad.p1.x) / 2 - left}px; top: ${quad.p1.y + (quad.p4.y - quad.p1.y) / 2 - top}px;" placement="middle-start"></visbug-handle>
      <visbug-handle style="position:absolute; left: ${quad.p2.x + (quad.p3.x - quad.p2.x) / 2 - left}px; top: ${quad.p2.y + (quad.p3.y - quad.p2.y) / 2 - top}px;" placement="middle-end"></visbug-handle>
      <visbug-handle style="position:absolute; left: ${quad.p4.x - left}px; top: ${quad.p4.y - top}px;" placement="bottom-start"></visbug-handle>
      <visbug-handle style="position:absolute; left: ${quad.p4.x + (quad.p3.x - quad.p4.x) / 2 - left}px; top: ${quad.p4.y + (quad.p3.y - quad.p4.y) / 2 - top}px;" placement="bottom-center"></visbug-handle>
      <visbug-handle style="position:absolute; left: ${quad.p3.x - left}px; top: ${quad.p3.y - top}px;" placement="bottom-end"></visbug-handle>
    `
  }
}

customElements.define('visbug-handles', Handles)
