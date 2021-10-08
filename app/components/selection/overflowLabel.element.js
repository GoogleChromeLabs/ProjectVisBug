import $ from 'blingblingjs'
import { OverflowLabelStyles } from '../styles.store'

window.addEventListener('scroll', positionFlags)

// hide overflow label indicators if you click anywhere:
document.body.addEventListener('click', () => {
  removeOverflowLabelIndicators()
}, true)

function positionFlags() {
  removeOverflowLabelIndicators()
  document.querySelectorAll('visbug-label').forEach((el) => {
    el.detectOutsideViewport(el)
  })
}

export class OverflowLabel extends HTMLElement {

  constructor() {
    super()
    this.$shadow = this.attachShadow({mode: 'closed'})
    this.dispatchQuery = this.dispatchQuery.bind(this)
  }

  connectedCallback() {
    this.$shadow.adoptedStyleSheets = [OverflowLabelStyles]
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
    this.$shadow.host.setAttribute('data-label-id', node_label_id)

    return `<span overflow-label>${this._text}</span>`
  }
}

customElements.define('visbug-overflow-label', OverflowLabel)

export function createOverflowLabelIndicator(node_label_id, text, hoverText, left, top, color, adjustRightSideToCount) {
  const existing = document.querySelectorAll(`visbug-overflow-label[id=${text}]`)

  if (existing.length) {
    existing[0].style.display = ''
    existing[0].style.setProperty('--left', left)
    existing[0].style.setProperty('--top', top)
    existing[0].style.setProperty('--position', 'fixed');
    if (color) existing[0].style.setProperty(`--label-bg`, color)
    existing[0].seen[node_label_id] = true;
    existing[0].count = Object.keys(existing[0].seen).length
    existing[0].text = text
    existing[0].style.setProperty('--count', `"\\00a0 ${existing[0].count}"`);
    existing[0].style.setProperty('--hover-text', `"\\00a0 first overflow: ${hoverText}"`);

    if (adjustRightSideToCount) {
      left = left.includes('calc(') ? left.replace(')', ` - ${existing[0].count.toString().length}ch)`) : `${existing[0].count.toString().length}ch`
      existing[0].style.setProperty('--left', left)
    }

    return
  }

  const label = document.createElement('visbug-overflow-label')

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
  label.style.setProperty('--hover-text', `"\\00a0 first overflow: ${hoverText}"`)
  if (color) label.style.setProperty(`--label-bg`, color)

  if (adjustRightSideToCount) {
    left = left.includes('calc(') ? left.replace(')', ` - 1ch)`) : `1ch`
    label.style.setProperty('--left', left)
  }

  document.body.appendChild(label)
}

export function removeOverflowLabelIndicators() {
  document.querySelectorAll('visbug-overflow-label')
    .forEach(e => {
      e.seen = {}
      e.count = 0
      e.text = ''
      e.style.display = 'none'
    })
}