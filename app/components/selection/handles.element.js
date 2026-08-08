import { HandlesStyles } from '../styles.store'
import { isFixed } from '../../utilities/'
import { getBoxQuad, quadBounds, quadPath, sideMidpoint } from './quad'

export class Handles extends HTMLElement {

  constructor() {
    super()
    this.$shadow = this.attachShadow({mode: 'closed'})
    this.styles = [HandlesStyles]
    this.on_position_change = this.on_position_change.bind(this)
    this.position_frame = null
    this.source_el = null
  }

  connectedCallback() {
    this.$shadow.adoptedStyleSheets = this.styles
    this.setAttribute('popover', 'manual')
    this.showPopover && this.showPopover()
    window.addEventListener('resize', this.on_position_change)
    window.addEventListener('scroll', this.on_position_change, true)
  }

  disconnectedCallback() {
    this.hidePopover && this.hidePopover()
    window.removeEventListener('resize', this.on_position_change)
    window.removeEventListener('scroll', this.on_position_change, true)
    this.position_frame && window.cancelAnimationFrame(this.position_frame)
  }

  on_position_change() {
    if (this.position_frame || !this.source_el) return

    this.position_frame = window.requestAnimationFrame(() => {
      this.position_frame = null
      if (!this.source_el.isConnected) return

      this.position = {
        node_label_id: this.getAttribute('data-label-id'),
        el: this.source_el,
      }
    })
  }

  set position({el, node_label_id}) {
    this.source_el = el
    this.$shadow.innerHTML = this.render(getBoxQuad(el), node_label_id, isFixed(el))

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

    const {left, top, width, height} = quadBounds(quad)
    const origin = {x: left, y: top}
    const positions = {
      'top-start':    quad.p1,
      'top-center':   sideMidpoint(quad, 'top'),
      'top-end':      quad.p2,
      'middle-start': sideMidpoint(quad, 'left'),
      'middle-end':   sideMidpoint(quad, 'right'),
      'bottom-start': quad.p4,
      'bottom-center': sideMidpoint(quad, 'bottom'),
      'bottom-end':   quad.p3,
    }

    this.style.setProperty('--top', `${top + (isFixed ? 0 : window.scrollY)}px`)
    this.style.setProperty('--left', `${left + (isFixed ? 0 : window.scrollX)}px`)
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
        <path d="${quadPath(quad, origin)}" stroke="var(--neon-pink)" fill="none"></path>
      </svg>
      ${Object.entries(positions).map(([placement, point]) => `
        <visbug-handle
          style="left:${point.x - left}px;top:${point.y - top}px"
          placement="${placement}"
        ></visbug-handle>`).join('')}
    `
  }
}

customElements.define('visbug-handles', Handles)
