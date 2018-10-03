import hotkeys  from 'hotkeys-js'

import { PaddingHotkeys } from './padding.element'
import { MarginHotkeys } from './margin.element'

export class Hotkeys extends HTMLElement {
  
  constructor() {
    super()
    this.render()
  }

  connectedCallback() {
    hotkeys('shift+/', e => {
      console.log('hi')
    })
  }
  disconnectedCallback() {}

  render() {
    this.appendChild(document.createElement('hotkeys-padding'))
    this.appendChild(document.createElement('hotkeys-margin'))
  }
}

customElements.define('pb-hotkeys', Hotkeys)