import { DeleteStyles } from '../styles.store'
import { animateViewTransition } from '../../utilities/'

export class Delete extends HTMLElement {
  constructor() {
    super()
    this.$shadow = this.attachShadow({mode: 'closed'})
    this.styles = [DeleteStyles]
    this.observers = []
  }

  addObservers(observers) {
    this.observers = observers
  }

  set linkedElementsToDeleteToo(elements) {
    this._linkedElementsToDeleteToo = elements
  }

  connectedCallback() {
    this.$shadow.adoptedStyleSheets = this.styles
    this.$shadow.innerHTML = this.render()
    
    const deleteBtn = this.$shadow.querySelector('button')
    deleteBtn.addEventListener('click', this.deleteElement.bind(this))
  }

  set position({el}) {
    this.targetElement = el
    const {top, right} = el.getBoundingClientRect()
    const isFixed = getComputedStyle(el).position === 'fixed'

    this.style.setProperty('--top', `${top + (isFixed ? 0 : window.scrollY)}px`)
    this.style.setProperty('--left', `${right + 10}px`)
    this.style.setProperty('--position', isFixed ? 'fixed' : 'absolute')
  }

  async deleteElement(e) {
    e.preventDefault()
    e.stopPropagation()
    
    if (!this.targetElement) {
      console.warn('No target element found to delete')
      return
    }

    this.observers.forEach(observer => observer.disconnect())

    const elements = [
      this.targetElement,
      ...this._linkedElementsToDeleteToo || [],
      ...Array.from(document.querySelectorAll(`[data-label-id="${this.targetElement.getAttribute('data-label-id')}"]`)),
      this
    ]

    await animateViewTransition(elements, () => this.performDeletion())
  }

  performDeletion() {
    this._linkedElementsToDeleteToo?.forEach(el => el.remove())
    this.targetElement.remove()
    
    const labelId = this.targetElement.getAttribute('data-label-id')
    if (labelId) {
      document.querySelectorAll(`[data-label-id="${labelId}"]`).forEach(el => el.remove())
    }
    
    this.remove()
  }

  render() {
    return `
      <button type="button" aria-label="Delete element">
        <svg viewBox="0 0 24 24">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
      </button>
    `
  }
}

customElements.define('visbug-delete', Delete)
