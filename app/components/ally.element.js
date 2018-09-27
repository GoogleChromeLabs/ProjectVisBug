import { Metatip } from './metatip.element.js'

export class Ally extends Metatip {
  constructor() {
    super()
  }
  
  render() {
    return `
      ${this.styles()}
      Hi
    `
  }
}

customElements.define('pb-ally', Ally)