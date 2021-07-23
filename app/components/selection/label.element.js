import $ from 'blingblingjs'
import { LabelStyles } from '../styles.store'
import { isFixed } from '../../utilities/';

window.addEventListener('scroll', positionFlags)

function positionFlags() {
  removeOverflowLabelIndicators()
  document.querySelectorAll('visbug-label').forEach((el) => {
    el.detectOutsideViewport()
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

    this.detectOutsideViewport()
  }

  render(node_label_id) {
    this.$shadow.host.setAttribute('data-label-id', node_label_id)

    return `<span>${this._text}</span>`
  }

  detectOutsideViewport() {
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

    let color = 'black'
    const adjustRightSideToCount = true

    if (outsideTop && !outsideLeft && !outsideRight) {
      style.left = Math.max(boundingBox.width, currentPosition.left)
      style.top = boundingBox.height
      style.overflowText = '↑'
      color = 'black'
      createOverflowLabelIndicator(style.overflowText, 'calc(50vw - 0.5rem)', '1rem', color)
    } else if (outsideTop && outsideLeft) {
      style.left = boundingBox.width
      style.top = boundingBox.height
      style.overflowText = '↖'
      color = 'red'
      createOverflowLabelIndicator(style.overflowText, '0', '1rem', color)
    } else if (outsideTop && outsideRight) {
      style.left = Math.max(boundingBox.width, currentPosition.left)
      style.top = boundingBox.height
      style.overflowText = '↗'
      color = 'purple'
      createOverflowLabelIndicator(style.overflowText, `calc(100vw - 1.5rem)`, '1rem', color, adjustRightSideToCount)
    } else if (outsideLeft && !outsideTop && !outsideBottom) {
      style.left = boundingBox.width
      style.top = Math.max(boundingBox.height, currentPosition.top)
      style.overflowText = '←'
      color = 'orange'
      createOverflowLabelIndicator(style.overflowText, 0, 'calc(50vh - 0.5rem)', color)
    } else if (outsideRight && !outsideTop && !outsideBottom) {
      style.left = window.innerWidth - boundingBox.width
      style.top = Math.max(boundingBox.height, currentPosition.top)
      style.overflowText = '→'
      color = 'navy'
      createOverflowLabelIndicator(style.overflowText, `calc(100vw - 1.5rem)`, 'calc(50vh - 0.5rem)', color, adjustRightSideToCount)
    } else if (outsideBottom && !outsideLeft && !outsideRight) {
      style.left = Math.max(boundingBox.width, currentPosition.left)
      style.top = window.innerHeight - boundingBox.height
      style.overflowText = '↓'
      color = 'green';
      createOverflowLabelIndicator(style.overflowText, 'calc(50vw - 0.5rem)', '100vh', color)
    } else if (outsideBottom && outsideLeft) {
      style.left = boundingBox.width
      style.top = window.innerHeight - boundingBox.height
      style.overflowText = '↙'
      color = 'goldenrod'
      createOverflowLabelIndicator(style.overflowText, 0, '100vh', color)
    } else if (outsideBottom && outsideRight) {
      style.left = Math.max(boundingBox.width, currentPosition.left)
      style.top = window.innerHeight - boundingBox.height
      style.overflowText = '↘'
      color = 'blue'
      createOverflowLabelIndicator(style.overflowText, `calc(100vw - 1.5rem)`, '100vh', color, adjustRightSideToCount)
    }
  }
}

customElements.define('visbug-label', Label)

// TODO: extract common functions and and move OverflowLabel to another file:
export class OverflowLabel extends HTMLElement {

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

function createOverflowLabelIndicator(text, left, top, color, adjustRightSideToCount) {
  const existing = document.querySelectorAll(`visbug-overflow-label[id=${text}]`)

  if (existing.length) {
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
  label.style.setProperty('--left', left)
  label.style.setProperty('--top', top)
  if (color) label.style.setProperty(`--label-bg`, color)

  if (adjustRightSideToCount) {
    left = left.includes('calc(') ? left.replace(')', ` - 1ch)`) : `1ch`
    label.style.setProperty('--left', left)
  }

  document.body.appendChild(label)
}

function removeOverflowLabelIndicators() {
  document.querySelectorAll('visbug-overflow-label').forEach(e => e.remove())
}