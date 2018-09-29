import $ from 'blingblingjs'
import { createClassname } from '../features/utils'
import styles from './metatip.element.css'

export class Metatip extends HTMLElement {
  
  constructor() {
    super()
    this.$shadow = this.attachShadow({mode: 'open'})
  }

  connectedCallback() {
    $('h5 > a', this.$shadow).on('click mouseenter', this.dispatchQuery.bind(this))
    $('h5 > a', this.$shadow).on('mouseleave', this.dispatchUnQuery.bind(this))
  }

  disconnectedCallback() {
    $('h5 > a', this.$shadow).off('click', this.dispatchQuery)
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

  dispatchUnQuery(e) {
    this.$shadow.host.dispatchEvent(new CustomEvent('unquery', {
      bubbles: true
    }))
  }

  set meta(data) {
    this.$shadow.innerHTML = this.render(data)
  }

  render({el, width, height, localModifications, notLocalModifications}) {
    return `
      ${this.styles()}
      <figure>
        <h5>
          <a href="#">${el.nodeName.toLowerCase()}</a>
          <a href="#">${el.id && '#' + el.id}</a>
          ${createClassname(el).split('.')
            .filter(name => name != '')
            .reduce((links, name) => `
              ${links}
              <a href="#">.${name}</a>
            `, '')
          }
        </h5>
        <small>
          <span">${Math.round(width)}</span>px 
          <span divider>×</span> 
          <span>${Math.round(height)}</span>px
        </small>
        <div>${notLocalModifications.reduce((items, item) => `
          ${items}
          <span prop>${item.prop}:</span>
          <span value>${item.value}</span>
        `, '')}</div>
        ${localModifications.length ? `
          <h6>Local Modifications</h6>
          <div>${localModifications.reduce((items, item) => `
            ${items}
            <span prop>${item.prop}:</span>
            <span value>${item.value}</span>
          `, '')}</div>
        ` : ''}
      </figure>
    `
  }

  styles() {
    return `
      <style>
        ${styles}
      </style>
    `
  }
}

customElements.define('pb-metatip', Metatip)