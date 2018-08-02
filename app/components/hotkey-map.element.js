import $ from 'blingblingjs'
import hotkeys from 'hotkeys-js'

export default class HotkeyMap extends HTMLElement {
  
  constructor() {
    super()
    this.$shadow = this.attachShadow({mode: 'open'})
    this.$shadow.innerHTML = this.render()
    this.$dialog = $('dialog', this.$shadow)
  }

  connectedCallback() {}
  disconnectedCallback() {}

  show() {
    this.$dialog[0].showModal()
  }

  render() {
    return `
      ${this.styles()}
      <dialog open>
        <div>Custom Element</div>
      </dialog>
    `
  }

  styles() {
    return `
      <style>
        :host {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100vw;
          height: 100vh;

          --dark-grey: hsl(0,0%,20%);
        }

        :host dialog {
          border: none;
          box-shadow: 0 0.25rem 0.25rem hsla(0,0%,0%,20%);
          color: var(--dark-grey);
        }
      </style>
    `
  }
}

customElements.define('hotkey-map', HotkeyMap)