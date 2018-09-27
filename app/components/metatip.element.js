export class Metatip extends HTMLElement {
  
  constructor() {
    super()
    this.$shadow = this.attachShadow({mode: 'open'})
  }

  connectedCallback() {}
  disconnectedCallback() {}

  render() {
    return `
      ${this.styles()}
      
    `
  }

  styles() {
    return `
      <style>
        :host {
          
        }
      </style>
    `
  }
}

customElements.define('pb-metatip', Metatip)