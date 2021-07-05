import $ from 'blingblingjs'
import { LabelStyles } from '../styles.store'
import { isFixed } from '../../utilities/';

window.addEventListener('scroll', positionFlags)

function positionFlags() {
  document.querySelectorAll('visbug-label').forEach((el) => {
    el.stayInsideViewport()
  })
}

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
      ? this.$shadow.firstElementChild.textContent = content
      : this._text = content
  }

  set position({boundingRect, node_label_id, isFixed}) {
    this.$shadow.innerHTML = this.render(node_label_id)
    this.update = {boundingRect, isFixed}
  }

  set update({boundingRect, isFixed}) {
    const top = boundingRect.y + (isFixed ? 0 : window.scrollY)
    const left = boundingRect.x - 1
    const position = isFixed ? 'fixed' : 'absolute'
    this.style.setProperty('--top', `${top}px`)
    this.style.setProperty('--left', `${left}px`)
    this.style.setProperty('--max-width', `${boundingRect.width + (window.innerWidth - boundingRect.x - boundingRect.width - 20)}px`)
    this.style.setProperty('--position', position)
    this.setAttribute('data-original-top', top)
    this.setAttribute('data-original-left', left)
    this.setAttribute('data-original-position', position)
    this.stayInsideViewport()
  }

  render(node_label_id) {
    this.$shadow.host.setAttribute('data-label-id', node_label_id)

    return `<span>${this._text}</span>`
  }

  stayInsideViewport() {
    const text = this.$shadow.firstElementChild.textContent.replace(/^[↑↓←→]/,'')
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
    const outsideLeft = originalPosition.left - boundingBox.width - scrollX < 0
    const outsideRight = originalPosition.left - scrollX > window.innerWidth

    const isOutsideViewport =
      outsideTop || outsideBottom || outsideLeft || outsideRight

    if (!isOutsideViewport) {
      this.style.setProperty('--position', originalPosition.position)
      this.style.setProperty('--left', `${originalPosition.left}px`)
      this.style.setProperty('--top', `${originalPosition.top}px`)
      this.text = text
      return;
    }

    const style = {
      position: 'fixed',
      left: currentPosition.left,
      top: currentPosition.top,
      overflowText: '',
    }

    if (outsideTop && !outsideLeft && !outsideRight) {
      style.left = Math.max(boundingBox.width, currentPosition.left)
      style.top = boundingBox.height
      style.overflowText = '↑'
    } else if (outsideTop && outsideLeft) {
      style.left = boundingBox.width
      style.top = boundingBox.height
      style.overflowText = '←'
    } else if (outsideTop && outsideRight) {
      style.left = Math.max(boundingBox.width, currentPosition.left)
      style.top = boundingBox.height
      style.overflowText = '→'
    } else if (outsideLeft && !outsideTop && !outsideBottom) {
      style.left = boundingBox.width
      style.top = Math.max(boundingBox.height, currentPosition.top)
      style.overflowText = '←'
    } else if (outsideRight && !outsideTop && !outsideBottom) {
      style.left = window.innerWidth - boundingBox.width
      style.top = Math.max(boundingBox.height, currentPosition.top)
      style.overflowText = '→'
    } else if (outsideBottom && !outsideLeft && !outsideRight) {
      style.left = Math.max(boundingBox.width, currentPosition.left)
      style.top = window.innerHeight - boundingBox.height
      style.overflowText = '↓'
    } else if (outsideBottom && outsideLeft) {
      style.left = boundingBox.width
      style.top = window.innerHeight - boundingBox.height
      style.overflowText = '←'
    } else if (outsideBottom && outsideRight) {
      style.left = Math.max(boundingBox.width, currentPosition.left)
      style.top = window.innerHeight - boundingBox.height
      style.overflowText = '→'
    }

    this.style.setProperty('--position', 'fixed')
    this.style.setProperty('--left', `${style.left}px`)
    this.style.setProperty('--top', `${style.top}px`)
    this.text = `${style.overflowText} ${text}`
  }
}

customElements.define('visbug-label', Label)
