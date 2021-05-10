import { Metatip } from './metatip.element.js'

export class Ally extends Metatip {
  constructor() {
    super()
  }

  copyColorSwatch() {
    alert('copyColorSwatch')
  }

  observe() {
    $('[color-swatch]', this.$shadow).on('click', this.copyColorSwatch.bind(this))
  }

  unobserve() {
    $('[color-swatch]', this.$shadow).off('click', this.copyColorSwatch.bind(this))
  }

  render({el, ally_attributes, contrast_results}) {
    return `
      <figure>
        <header>
          <h5>${el.nodeName.toLowerCase()}${el.id && '#' + el.id}</h5>
        </header>
        <code accessibility>
          ${ally_attributes.reduce((items, attr) => `
            ${items}
            <span prop>${attr.prop}:</span>
            <span value>${attr.value}</span>
          `, '')}
          ${contrast_results}
        </code>
      </figure>
    `
  }
}

customElements.define('visbug-ally', Ally)
