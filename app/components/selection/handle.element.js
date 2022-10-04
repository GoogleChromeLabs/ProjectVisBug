import $ from 'blingblingjs'
import { HandleStyles } from '../styles.store'
import { clamp } from '../../utilities/numbers'

export class Handle extends HTMLElement {

  constructor() {
    super()
    this.$shadow = this.attachShadow({mode: 'closed'})
    this.styles = [HandleStyles]
  }

  connectedCallback() {
    this.$shadow.adoptedStyleSheets = this.styles
    this.$shadow.innerHTML = this.render()
    
    this.button = this.$shadow.querySelector('button')
    this.button.addEventListener('pointerdown', this.on_element_resize_start.bind(this))

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

  on_element_resize_start(e) {
    e.preventDefault()
    e.stopPropagation()

    if (e.button !== 0) return

    const placement = this.placement
    const handlesEl = e.path.find(el => el.tagName === 'VISBUG-HANDLES')
    const nodeLabelId = handlesEl.getAttribute('data-label-id')
    const [sourceEl] = $(`[data-label-id="${nodeLabelId}"]`)

    if (!sourceEl) return

    const { x: initialX, y: initialY } = e
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

      const newX = clamp(0, e.clientX, document.documentElement.clientWidth)
      const newY = clamp(0, e.clientY, document.documentElement.clientHeight)
    
      const diffX = newX - initialX
      const diffY = newY - initialY

      switch (placement) {
        case 'top-start': {
          const newWidth = initialWidth - diffX
          const newHeight = initialHeight - diffY
          const newTranslate = initialTransform.translate(diffX, diffY).transformPoint()

          requestAnimationFrame(() => {
            sourceEl.style.width = `${newWidth}px`
            sourceEl.style.height = `${newHeight}px`
            sourceEl.style.transform = `translate(${newTranslate.x}px, ${newTranslate.y}px)`
          })
          break
        }
        case 'top-center': {
          const newHeight = initialHeight - diffY
          const newTranslate = initialTransform.translate(0, diffY).transformPoint()

          requestAnimationFrame(() => {
            sourceEl.style.height = `${newHeight}px`
            sourceEl.style.transform = `translate(${newTranslate.x}px, ${newTranslate.y}px)`
          })
          break
        }
        case 'top-end': {
          const newWidth = initialWidth + diffX
          const newHeight = initialHeight - diffY
          const newTranslate = initialTransform.translate(0, diffY).transformPoint()

          requestAnimationFrame(() => {
            sourceEl.style.width = `${newWidth}px`
            sourceEl.style.height = `${newHeight}px`
            sourceEl.style.transform = `translate(${newTranslate.x}px, ${newTranslate.y}px)`
          })
          break
        }
        case 'middle-start': {
          const newWidth = initialWidth - diffX
          const newTranslate = initialTransform.translate(diffX).transformPoint()

          requestAnimationFrame(() => {
            sourceEl.style.width = `${newWidth}px`
            sourceEl.style.transform = `translate(${newTranslate.x}px, ${newTranslate.y}px)`
          })
          break
        }
        case 'middle-end': {
          const newWidth = initialWidth + diffX

          requestAnimationFrame(() => {
            sourceEl.style.width = `${newWidth}px`
          })
          break
        }
        case 'bottom-start': {
          const newWidth = initialWidth - diffX
          const newHeight = initialHeight + diffY
          const newTranslate = initialTransform.translate(diffX, 0).transformPoint()

          requestAnimationFrame(() => {
            sourceEl.style.width = `${newWidth}px`
            sourceEl.style.height = `${newHeight}px`
            sourceEl.style.transform = `translate(${newTranslate.x}px, ${newTranslate.y}px)`
          })
          break
        }
        case 'bottom-center': {
          const newHeight = initialHeight + diffY

          requestAnimationFrame(() => {
            sourceEl.style.height = `${newHeight}px`
          })
          break
        }
        case 'bottom-end': {
          const newWidth = initialWidth + diffX
          const newHeight = initialHeight + diffY

          requestAnimationFrame(() => {
            sourceEl.style.width = `${newWidth}px`
            sourceEl.style.height = `${newHeight}px`
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
    this.button.removeEventListener('pointerdown', this.on_element_resize_start.bind(this))
  }

  render() {
    return `
      <button type="button" aria-label="Resize"></button>
    `
  }
}

customElements.define('visbug-handle', Handle)
