import $ from 'blingblingjs'
import { createClassname, schemeRule } from '../../utilities/'
import { draggable } from '../../features/'
import { MetatipStyles, MetatipLightStyles, MetatipDarkStyles } from '../styles.store'

export class Metatip extends HTMLElement {

  constructor() {
    super()
    this.$shadow = this.attachShadow({mode: 'closed'})
    this.applyScheme = schemeRule(
      this.$shadow,
      MetatipStyles, MetatipLightStyles, MetatipDarkStyles
    )

    this.observe = this.observe.bind(this)
    this.dispatchQuery = this.dispatchQuery.bind(this)
    this.dispatchUnQuery = this.dispatchUnQuery.bind(this)
  }

  connectedCallback() {
    this.applyScheme(document.querySelector("vis-bug").getAttribute("color-scheme"))
    $(this.$shadow.host).on('mouseenter', this.observe)
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
    $('h5 > a', this.$shadow).on('click mouseenter', this.dispatchQuery)
    $('h5 > a', this.$shadow).on('mouseleave', this.dispatchUnQuery)

    draggable({
      el: this,
      surface: this.$shadow.querySelector('header'),
      cursor: 'grab',
    })
  }

  unobserve() {
    $('h5 > a', this.$shadow).off('click mouseenter', this.dispatchQuery)
    $('h5 > a', this.$shadow).off('mouseleave', this.dispatchUnQuery)
  }

  dispatchUnQuery(e) {
    this.$shadow.host.dispatchEvent(new CustomEvent('unquery', {
      bubbles: true
    }))
    this.unobserve()
    this.teardown()
  }

  set meta(data) {
    this.$shadow.innerHTML = this.render(data)
  }

  render({el, width, height, localModifications, notLocalModifications}) {
    return `
      <figure>
        <header>
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
            <span>${Math.round(width)}</span><span brand>px</span>
            <span divider>×</span>
            <span>${Math.round(height)}</span><span brand>px</span>
          </small>
        </header>

        <code>${notLocalModifications.reduce((items, item) => `
          ${items}
          <span><span prop>${item.prop}</span>:</span>
          <span value>${item.value}</span>
        `, '')}
        </code>
        ${localModifications.length ? `
          <details>
            <summary>Local Modifications / Inline Styles</summary>
            <code>${localModifications.reduce((items, item) => `
              ${items}
              <span><span prop>${item.prop}</span>:</span>
              <span value>${item.value}</span>
            `, '')}
            </code>
          </details>
        ` : ''}
      </figure>
    `
  }
}

customElements.define('visbug-metatip', Metatip)
