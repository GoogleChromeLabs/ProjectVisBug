import hotkeys  from 'hotkeys-js'

import { PaddingHotkeys } from './padding.element'
import { MarginHotkeys } from './margin.element'

export class Hotkeys extends HTMLElement {
  
  constructor() {
    super()
    this.$shadow = this.attachShadow({mode: 'open'})
    this.$shadow.innerHTML  = this.render()
  }

  connectedCallback() {
    hotkeys('shift+/', e => {
      console.log('hi')
    })
  }
  disconnectedCallback() {}

  render() {
    return `
      <hotkeys-padding></hotkeys-padding>
      <hotkeys-margin></hotkeys-margin>
    `
  }
}

customElements.define('pb-hotkeys', Hotkeys)