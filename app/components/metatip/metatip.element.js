import $ from 'blingblingjs'
import { createClassname } from '../../utilities/'
import { MetatipStyles } from '../styles.store'

export class Metatip extends HTMLElement {

  constructor() {
    super()
    this.$shadow = this.attachShadow({mode: 'closed'})
  }

  connectedCallback() {
    this.$shadow.adoptedStyleSheets = [MetatipStyles]
    $(this.$shadow.host).on('mouseenter', this.observe.bind(this))
  }

  disconnectedCallback() {
    this.unobserve()
  }

  dispatchQuery(e) {
    this.$shadow.host.dispatchEvent(new CustomEvent('query', {
      bubbles: true,
      detail:   {
        text:       e.target.textContent,
        activator:  e.type,
      }
    }))
  }

  observe() {
    $('h5 > a', this.$shadow).on('click mouseenter', this.dispatchQuery.bind(this))
    $('h5 > a', this.$shadow).on('mouseleave', this.dispatchUnQuery.bind(this))
  }

  unobserve() {
    $('h5 > a', this.$shadow).off('click mouseenter', this.dispatchQuery.bind(this))
    $('h5 > a', this.$shadow).off('mouseleave', this.dispatchUnQuery.bind(this))
  }

  dispatchUnQuery(e) {
    this.$shadow.host.dispatchEvent(new CustomEvent('unquery', {
      bubbles: true
    }))
    this.unobserve()
  }

  set meta(data) {
    this.$shadow.innerHTML = this.render(data)
  }

  render({el, width, height, localModifications, notLocalModifications}) {
    return `
      <figure>
        <h5>
          <a node>${el.nodeName.toLowerCase()}</a>
          <a>${el.id && '#' + el.id}</a>
          ${createClassname(el).split('.')
            .filter(name => name != '')
            .reduce((links, name) => `
              ${links}
              <a>.${name}</a>
            `, '')
          }
        </h5>
        <small>
          <span">${Math.round(width)}</span>px
          <span divider>×</span>
          <span>${Math.round(height)}</span>px
        </small>
        ${localModifications.length ? `
          <h6 local-modifications>Local Modifications</h6>
          <div>${localModifications.reduce((items, item) => `
            ${items}
            <span prop>${item.prop}:</span>
            <span value>${item.value}</span>
          `, '')}
          </div>
        ` : ''}
        <div>${notLocalModifications.reduce((items, item) => `
          ${items}
          <span prop>${item.prop}:</span>
          <span value>${item.value}</span>
        `, '')}
        </div>
      </figure>
    `
  }
}

customElements.define('visbug-metatip', Metatip)
