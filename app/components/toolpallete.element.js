import { $$ } from 'blingblingjs'

export default class ToolPallete extends HTMLElement {
  
  constructor() {
    super()
    this.$shadow = this.attachShadow({mode: 'open'})
    this.$shadow.innerHTML = `
      ${this.styles()}
      ${this.render()}
    `

    // dispatch event example
    // this.dispatchEvent(
    //   new CustomEvent('outbound-message', 
    //     { detail: payload, bubbles: false }))
  }

  connectedCallback() {
    $$('li', this.$shadow).on('click', e =>
      console.log(e))
  }

  disconnectedCallback() {
    
  }

  render() {
    return `
      ${this.styles()}
      <ol>
        <li>S</li>
        <li>E</li>
        <li>L</li>
        <li>E</li>
      </ol>
    `
  }

  styles() {
    return `
      <style>
        :host {
          position: fixed;
          top: 1rem;
          left: 1rem;

          background: white;
          box-shadow: 0 0.25rem 0.5rem hsla(0,0%,0%,10%);
        }

        ol {
          margin: 0;
          padding: 0;
          list-style-type: none;

          display: flex;
          flex-direction: column;
        }

        li {
          height: 2.5rem;
          width: 2.5rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        li:hover {
          cursor: pointer;
          background: hsl(0,0%,98%);
        }

        :host([hidden]) { 
          display: none; 
        }
      </style>
    `
  }
}

customElements.define('tool-pallete', ToolPallete)