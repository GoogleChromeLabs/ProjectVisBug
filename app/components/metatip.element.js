import $ from 'blingblingjs'
import { createClassname } from '../features/utils'

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
        :host {
          position: absolute;
          z-index: 99999;
          background: white;
          color: hsl(0,0%,20%);
          padding: 0.5rem;
          display: flex;
          flex-direction: column;
          flex-wrap: nowrap;
          box-shadow: 0 0 0.5rem hsla(0,0%,0%,10%);
          border-radius: 0.25rem;
        }

        :host figure {
          margin: 0;
        }

        :host h5 {
          display: flex;
          font-size: 1rem;
          font-weight: bolder;
          margin: 0;
        }

        :host h5 > a {
          text-decoration: none;
          color: inherit;
        }

        :host h5 > a:hover {
          color: hotpink; 
          text-decoration: underline;
        }

        :host h5 > a:empty {
          display: none;
        }

        :host h6 {
          margin-top: 1rem;
          margin-bottom: 0;
          font-weight: normal;
        }

        :host small {
          font-size: 0.7rem;
          color: hsl(0,0%,60%);
        }

        :host small > span {
          color: hsl(0,0%,20%);
        }

        :host [brand], 
        :host [divider] {
          color: hotpink;
        }

        :host div {
          display: grid;
          grid-template-columns: auto auto;
          grid-gap: 0.25rem 0.5rem;
          margin: 0.5rem 0 0;
          padding: 0;
          list-style-type: none;
          color: hsl(0,0%,40%);
          font-size: 0.8rem;
          font-family: 'Dank Mono', 'Operator Mono', 'Inconsolata', 'Fira Mono', 'SF Mono', 'Monaco', 'Droid Sans Mono', 'Source Code Pro', monospace;
        }

        :host [value] {
          color: hsl(0,0%,20%);
          display: inline-flex;
          align-items: center;
          justify-content: flex-end;
          text-align: right;
          white-space: pre;
        }

        :host [color] {
          position: relative;
          top: 1px;
          display: inline-block;
          width: 0.6rem;
          height: 0.6rem;
          border-radius: 50%;
          margin-right: 0.25rem;
        }

        :host [contrast] > span {
          padding: 0 0.5rem 0.1rem;
          border-radius: 1rem;
          box-shadow: 0 0 0 1px hsl(0,0%,90%);
        }
      </style>
    `
  }
}

customElements.define('pb-metatip', Metatip)