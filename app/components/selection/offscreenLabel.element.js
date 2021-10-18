import $ from 'blingblingjs'
import { OffscreenLabelStyles } from '../styles.store'

window.addEventListener('scroll', positionFlags)

// hide offscreen label indicators if you click anywhere:
document.body.addEventListener('click', () => {
  removeOffscreenLabelIndicators()
}, true)

function positionFlags() {
  removeOffscreenLabelIndicators()
  document.querySelectorAll('visbug-label').forEach((el) => {
    el.detectOutsideViewport()
  })
}

export class OffscreenLabel extends HTMLElement {

  constructor() {
    super()
    this.$shadow = this.attachShadow({mode: 'closed'})
    this.dispatchQuery = this.dispatchQuery.bind(this)
  }

  connectedCallback() {
    this.$shadow.adoptedStyleSheets = [OffscreenLabelStyles]
    $('a', this.$shadow).on('click mouseenter', this.dispatchQuery)
  }

  disconnectedCallback() {
    $('a', this.$shadow).off('click mouseenter', this.dispatchQuery)
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
    this.style.setProperty('--top', `${boundingRect.y + (isFixed ? 0 : window.scrollY)}px`)
    this.style.setProperty('--left', `${boundingRect.x - 1}px`)
    this.style.setProperty('--max-width', `${boundingRect.width + (window.innerWidth - boundingRect.x - boundingRect.width - 20)}px`)
    this.style.setProperty('--position', 'fixed');
  }

  set count(count) {
    this.$shadow.childElementCount
      ? this.$shadow.firstElementChild.count = count
      : this._count = count
  }

  get count() {
    return this.$shadow.childElementCount
      ? this.$shadow.firstElementChild.count
      : this._count
  }

  render(node_label_id) {
    this.$shadow.host.setAttribute('data-label-id', node_label_id || ('label_' + Number(new Date())))

    return `<span offscreen-label>${this._text}</span>`
  }
}

customElements.define('visbug-offscreen-label', OffscreenLabel)

export function createOffscreenLabelIndicator(node_label_id, text, hoverText, left, top, color, adjustRightSideToCount) {
  const existing = document.querySelectorAll(`visbug-offscreen-label[id=${text}]`)

  if (existing.length) {
    const instance = existing[0];
    instance.style.display = ''
    instance.style.setProperty('--left', left)
    instance.style.setProperty('--top', top)
    instance.style.setProperty('--position', 'fixed');
    if (color) instance.style.setProperty('--label-bg', color)
    instance.seen[node_label_id] = true;
    instance.count = Object.keys(instance.seen).length
    instance.text = text
    instance.style.setProperty('--count', `"\\00a0 ${instance.count}"`);
    instance.style.setProperty('--hover-text', `"\\00a0 ${hoverText ? 'offscreen label: ' + hoverText : instance.count}"`);
    if (adjustRightSideToCount) {
      left = left.includes('calc(') ? left.replace(')', ` - ${instance.count.toString().length}ch)`) : `${instance.count.toString().length}ch`
      instance.style.setProperty('--left', left)
    }

    return
  }

  const label = document.createElement('visbug-offscreen-label')

  label.id = text
  label.position = {
    boundingRect: document.body.getBoundingClientRect(),
    isFixed: true,
  }
  label.seen = {} // reset
  label.seen[node_label_id] = true
  label.count = 1
  label.text = text
  label.style.display = ''
  label.style.setProperty('--left', left)
  label.style.setProperty('--top', top)
  label.style.setProperty('--count', `"\\00a0 ${label.count}"`)
  label.style.setProperty('--hover-text', `"\\00a0 ${hoverText ? 'offscreen label: ' + hoverText : label.count}"`)
  if (color) label.style.setProperty('--label-bg', color)

  if (adjustRightSideToCount) {
    left = left.includes('calc(') ? left.replace(')', ` - 1ch)`) : `1ch`
    label.style.setProperty('--left', left)
  }

  document.body.appendChild(label)
}

export function removeOffscreenLabelIndicators() {
  document.querySelectorAll('visbug-offscreen-label')
    .forEach(e => {
      e.seen = {}
      e.count = 0
      e.text = ''
      e.style.display = 'none'
    })
}