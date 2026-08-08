import $ from 'blingblingjs'
import { HandleStyles } from '../styles.store'

export class Handle extends HTMLElement {

  constructor() {
    super()
    this.$shadow = this.attachShadow({mode: 'closed'})
    this.styles = [HandleStyles]
    this.on_resize_start = this.on_element_resize_start.bind(this)
  }

  connectedCallback() {
    this.$shadow.adoptedStyleSheets = this.styles
    this.$shadow.innerHTML = this.render()

    this.button = this.$shadow.querySelector('button')
    this.button.addEventListener('pointerdown', this.on_resize_start)

    this.placement = this.getAttribute('placement')
  }

  static get observedAttributes() {
    return ['placement']
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'placement') {
      this.placement = newValue
    }
  }

  /**
   * @param {PointerEvent} e
   */
  on_element_resize_start(e) {
    e.preventDefault()
    e.stopPropagation()

    if (e.button !== 0) return

    const placement = this.placement
    const handlesEl = e.composedPath().find(el => el.tagName === 'VISBUG-HANDLES')
    const nodeLabelId = handlesEl.getAttribute('data-label-id')
    /** @type {Element[]} */
    const [sourceEl] = $(`[data-label-id="${nodeLabelId}"]`)

    if (!sourceEl) return

    const t = sourceEl.convertPointFromNode(e, document.documentElement)

    const { x: initialX, y: initialY } = t
    const initialStyle = getComputedStyle(sourceEl)
    const initialWidth = parseFloat(initialStyle.width)
    const initialHeight = parseFloat(initialStyle.height)
    const initialTransform = new DOMMatrix(initialStyle.transform)

    const originalElTransition = sourceEl.style.transition
    const originalDocumentCursor = document.body.style.cursor
    const originalDocumentUserSelect = document.body.style.userSelect
    sourceEl.style.transition = 'none'
    document.body.style.cursor = getComputedStyle(this).getPropertyValue('--cursor')
    document.body.style.userSelect = 'none'

    document.addEventListener('pointermove', on_element_resize_move)

    function on_element_resize_move(e) {
      e.preventDefault()
      e.stopPropagation()

      const {x: newX, y: newY} = sourceEl.convertPointFromNode(e, document.documentElement)

      const diffX = newX - initialX
      const diffY = newY - initialY
      const leftWidth = Math.max(0, initialWidth - diffX)
      const rightWidth = Math.max(0, initialWidth + diffX)
      const topHeight = Math.max(0, initialHeight - diffY)
      const bottomHeight = Math.max(0, initialHeight + diffY)
      const leftShift = initialWidth - leftWidth
      const topShift = initialHeight - topHeight

      switch (placement) {
        case 'top-start': {
          const newTransform = initialTransform.translate(leftShift, topShift)

          requestAnimationFrame(() => {
            sourceEl.style.width = `${leftWidth}px`
            sourceEl.style.height = `${topHeight}px`
            sourceEl.style.transform = newTransform.toString()
          })
          break
        }
        case 'top-center': {
          const newTransform = initialTransform.translate(0, topShift)

          requestAnimationFrame(() => {
            sourceEl.style.height = `${topHeight}px`
            sourceEl.style.transform = newTransform.toString()
          })
          break
        }
        case 'top-end': {
          const newTransform = initialTransform.translate(0, topShift)

          requestAnimationFrame(() => {
            sourceEl.style.width = `${rightWidth}px`
            sourceEl.style.height = `${topHeight}px`
            sourceEl.style.transform = newTransform.toString()
          })
          break
        }
        case 'middle-start': {
          const newTransform = initialTransform.translate(leftShift)

          requestAnimationFrame(() => {
            sourceEl.style.width = `${leftWidth}px`
            sourceEl.style.transform = newTransform.toString()
          })
          break
        }
        case 'middle-end': {
          requestAnimationFrame(() => {
            sourceEl.style.width = `${rightWidth}px`
          })
          break
        }
        case 'bottom-start': {
          const newTransform = initialTransform.translate(leftShift, 0)

          requestAnimationFrame(() => {
            sourceEl.style.width = `${leftWidth}px`
            sourceEl.style.height = `${bottomHeight}px`
            sourceEl.style.transform = newTransform.toString()
          })
          break
        }
        case 'bottom-center': {
          requestAnimationFrame(() => {
            sourceEl.style.height = `${bottomHeight}px`
          })
          break
        }
        case 'bottom-end': {
          requestAnimationFrame(() => {
            sourceEl.style.width = `${rightWidth}px`
            sourceEl.style.height = `${bottomHeight}px`
          })
          break
        }
      }
    }

    document.addEventListener('pointerup', on_element_resize_end, { once: true })
    document.addEventListener('mouseleave', on_element_resize_end, { once: true })

    function on_element_resize_end() {
      document.removeEventListener('pointermove', on_element_resize_move)
      document.body.style.cursor = originalDocumentCursor
      document.body.style.userSelect = originalDocumentUserSelect
      sourceEl.style.transition = originalElTransition
    }
  }

  disconnectedCallback() {
    this.button && this.button.removeEventListener('pointerdown', this.on_resize_start)
  }

  render() {
    return `
      <button type="button" aria-label="Resize"></button>
    `
  }
}

customElements.define('visbug-handle', Handle)
