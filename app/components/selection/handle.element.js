import $ from 'blingblingjs'
import { HandleStyles } from '../styles.store'

export class Handle extends HTMLElement {

	constructor() {
		super()
    this.$shadow = this.attachShadow({mode: 'closed'})
    this.styles = [HandleStyles]
	}
	
  connectedCallback() {
    this.$shadow.adoptedStyleSheets = this.styles
		this.$shadow.innerHTML = this.render();
		
		this.button = this.$shadow.querySelector('button')
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

	render() {
		return `
			<button type="button" aria-label="Resize"></button>
		`
	}
}

customElements.define('visbug-handle', Handle)
