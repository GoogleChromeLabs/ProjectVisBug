import { LabelStyles } from '../styles.store'

window.addEventListener('scroll', positionFlags)

function positionFlags() {
  removeOverflowLabelIndicators()
  document.querySelectorAll('visbug-label').forEach((el) => {
    el.detectOutsideViewport()
  })
}

export class OverflowLabel extends HTMLElement {

  constructor() {
    super()
    this.$shadow = this.attachShadow({mode: 'closed'})
  }

  connectedCallback() {
    this.$shadow.adoptedStyleSheets = [LabelStyles]
  }

  disconnectedCallback() {
    window.removeEventListener('resize', this.on_resize)
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
    this.style.setProperty('--position', isFixed ? 'fixed' : 'absolute');
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

    return `<span>${this._text}</span>`
  }
}

customElements.define('visbug-overflow-label', OverflowLabel)

export function createOverflowLabelIndicator(text, left, top, color, adjustRightSideToCount) {
  const existing = document.querySelectorAll(`visbug-overflow-label[id=${text}]`)

  if (existing.length) {
    existing[0].style.display = ''
    existing[0].style.setProperty('--left', left)
    existing[0].style.setProperty('--top', top)
    existing[0].style.setProperty('--position', 'fixed');
    if (color) existing[0].style.setProperty(`--label-bg`, color)
    existing[0].count++
    existing[0].text = `${text} ${existing[0].count}`

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
  label.count = 1
  label.text = `${text} ${label.count}`
  label.style.display = ''
  label.style.setProperty('--left', left)
  label.style.setProperty('--top', top)
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
      e.count = 0
      e.text = ''
      e.style.display = 'none'
    })
}