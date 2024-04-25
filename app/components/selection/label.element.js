import $ from 'blingblingjs'
import { LabelStyles } from '../styles.store'
import { isFixed } from '../../utilities/';
import { createOffscreenLabelIndicator } from './offscreenLabel.element'

export class Label extends HTMLElement {

  constructor() {
    super()
    this.$shadow = this.attachShadow({mode: 'closed'})
    this.on_resize = this.on_resize.bind(this)
    this.dispatchQuery = this.dispatchQuery.bind(this)
  }

  connectedCallback() {
    this.$shadow.adoptedStyleSheets = [LabelStyles]
    this.setAttribute('popover', 'manual')
    this.showPopover && this.showPopover()
    $('a', this.$shadow).on('click mouseenter', this.dispatchQuery)
    window.addEventListener('resize', this.on_resize)
  }

  disconnectedCallback() {
    this.hidePopover && this.hidePopover()
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
    const top = boundingRect.y + (isFixed ? 0 : window.scrollY)
    const left = boundingRect.x
    const position = isFixed ? 'fixed' : 'absolute'
    this.style.setProperty('--top', `${top}px`)
    this.style.setProperty('--left', `${left}px`)
    this.style.setProperty('--max-width', `${boundingRect.width + (window.innerWidth - boundingRect.x - boundingRect.width - 40)}px`)
    this.style.setProperty('--position', position)
    this.setAttribute('data-original-top', top)
    this.setAttribute('data-original-left', left)
    this.setAttribute('data-original-position', position)

    this.detectOutsideViewport()
  }

  render(node_label_id) {
    this.$shadow.host.setAttribute('data-label-id', node_label_id || ('label_' + Number(new Date())))

    return `<span>${this._text}</span>`
  }

  detectOutsideViewport() {
    const hoverText = this.$shadow.firstElementChild.innerText.replace(/\s+/g, ' ')
    if (hoverText === 'body') return;

    const boundingBox = this.$shadow.firstElementChild.getBoundingClientRect()

    const currentStyle = window.getComputedStyle(this);
    const currentPosition = {
      top: currentStyle.getPropertyValue('--top').replace('px', ''),
      left: currentStyle.getPropertyValue('--left').replace('px', ''),
    }

    const originalPosition = {
      top: this.getAttribute('data-original-top'),
      left: this.getAttribute('data-original-left'),
      position: this.getAttribute('data-original-position'),
    }

    const scrollX = document.body.scrollX || window.pageXOffset
    const scrollY = document.body.scrollY || window.pageYOffset

    const outsideTop = originalPosition.top - boundingBox.height - scrollY < 0
    const outsideBottom = originalPosition.top - scrollY > window.innerHeight
    const outsideLeft = originalPosition.left - scrollX < 0
    const outsideRight = originalPosition.left - scrollX > window.innerWidth

    const isOutsideViewport =
      outsideTop || outsideBottom || outsideLeft || outsideRight

    if (!isOutsideViewport) {
      this.style.setProperty('--position', originalPosition.position)
      this.style.setProperty('--left', `${originalPosition.left}px`)
      this.style.setProperty('--top', `${originalPosition.top}px`)
      return;
    }

    const adjustRightSideToCount = true
    const node_label_id = this.getAttribute('data-label-id')
    const style = {
      position: 'fixed',
      color: 'var(--theme-purple)',
      left: currentPosition.left,
      top: currentPosition.top,
      offscreenText: '',
      hoverText: hoverText,
    }

    if (outsideTop && !outsideLeft && !outsideRight) {
      style.left = Math.max(boundingBox.width, currentPosition.left)
      style.top = boundingBox.height
      style.offscreenText = '↑'
      createOffscreenLabelIndicator(node_label_id, style.offscreenText, style.hoverText, 'calc(50vw - 0.5rem)', '1rem', style.color)
    } else if (outsideTop && outsideLeft) {
      style.left = boundingBox.width
      style.top = boundingBox.height
      style.offscreenText = '↖'
      createOffscreenLabelIndicator(node_label_id, style.offscreenText, style.hoverText, '0', '1rem', style.color)
    } else if (outsideTop && outsideRight) {
      style.left = Math.max(boundingBox.width, currentPosition.left)
      style.top = boundingBox.height
      style.offscreenText = '↗'
      createOffscreenLabelIndicator(node_label_id, style.offscreenText, style.hoverText, `calc(100vw - 1.5rem)`, '1rem', style.color, adjustRightSideToCount)
    } else if (outsideLeft && !outsideTop && !outsideBottom) {
      style.left = boundingBox.width
      style.top = Math.max(boundingBox.height, currentPosition.top)
      style.offscreenText = '←'
      createOffscreenLabelIndicator(node_label_id, style.offscreenText, style.hoverText, 0, 'calc(50vh - 0.5rem)', style.color)
    } else if (outsideRight && !outsideTop && !outsideBottom) {
      style.left = window.innerWidth - boundingBox.width
      style.top = Math.max(boundingBox.height, currentPosition.top)
      style.offscreenText = '→'
      createOffscreenLabelIndicator(node_label_id, style.offscreenText, style.hoverText, `calc(100vw - 1.5rem)`, 'calc(50vh - 0.5rem)', style.color, adjustRightSideToCount)
    } else if (outsideBottom && !outsideLeft && !outsideRight) {
      style.left = Math.max(boundingBox.width, currentPosition.left)
      style.top = window.innerHeight - boundingBox.height
      style.offscreenText = '↓'
      createOffscreenLabelIndicator(node_label_id, style.offscreenText, style.hoverText, 'calc(50vw - 0.5rem)', '100vh', style.color)
    } else if (outsideBottom && outsideLeft) {
      style.left = boundingBox.width
      style.top = window.innerHeight - boundingBox.height
      style.offscreenText = '↙'
      createOffscreenLabelIndicator(node_label_id, style.offscreenText, style.hoverText, 0, '100vh', style.color)
    } else if (outsideBottom && outsideRight) {
      style.left = Math.max(boundingBox.width, currentPosition.left)
      style.top = window.innerHeight - boundingBox.height
      style.offscreenText = '↘'
      createOffscreenLabelIndicator(node_label_id, style.offscreenText, style.hoverText, `calc(100vw - 1.5rem)`, '100vh', style.color, adjustRightSideToCount)
    }
  }
}

customElements.define('visbug-label', Label)
