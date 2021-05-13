import $ from 'blingblingjs'
import { Metatip } from './metatip.element.js'
import { TinyColor } from '@ctrl/tinycolor'
import { getStyle, getComputedBackgroundColor } from '../../utilities'
import { getContrastingColor } from '../../utilities'

const modemap = {
  'hex': 'toHexString',
  'hsl': 'toHslString',
  'rgb': 'toRgbString',
}

export class Ally extends Metatip {
  constructor() {
    super()
  }

  async copyToClipboard(text) {
    const {state} = await navigator.permissions.query({name:'clipboard-write'})
    
    if (state === 'granted')
      navigator.clipboard.writeText(text)
  }

  copyColorSwatch(event) {
    this.copyToClipboard(event.target.querySelector('span').innerText.trim())
  }

  observe() {
    $('[color-swatch], [color-swatch] *', this.$shadow).on('click', this.copyColorSwatch.bind(this))
  }

  unobserve() {
    $('[color-swatch], [color-swatch] *', this.$shadow).off('click', this.copyColorSwatch.bind(this))
  }

  render({el, ally_attributes, contrast_results}) {
    const colormode = modemap[$('vis-bug').attr('color-mode')]

    const foreground = el instanceof SVGElement
      ? (getStyle(el, 'fill') || getStyle(el, 'stroke'))
      : getStyle(el, 'color')
    const background = getComputedBackgroundColor(el)

    const contrastingForegroundColor = getContrastingColor(foreground)
    const contrastingBackgroundColor = getContrastingColor(background)

    this.style.setProperty('--copy-message-left-color', contrastingForegroundColor)
    this.style.setProperty('--copy-message-right-color', contrastingBackgroundColor)

    return `
      <figure>
        <header>
          <h5>${el.nodeName.toLowerCase()}${el.id && '#' + el.id}</h5>
        </header>
        <div color-swatches>
          <span color-swatch style="background-color:${foreground};">
            <small style="color:${contrastingForegroundColor};">
              Foreground
            </small>
            <span style="color:${contrastingForegroundColor};">
              ${new TinyColor(foreground)[colormode]()}
            </span>
          </span>
          <span color-swatch style="background-color:${background};">
            <small style="color:${contrastingBackgroundColor};">
              Background
            </small>
            <span style="color:${contrastingBackgroundColor};">
              ${new TinyColor(background)[colormode]()}
            </span>
          </span>
        </div>
        <code accessibility>
          <div>
            ${ally_attributes.reduce((items, attr) => `
              ${items}
              <span prop>${attr.prop}:</span>
              <span value>${attr.value}</span>
            `, '')}
          </div>
          ${contrast_results}
        </code>
      </figure>
    `
  }
}

customElements.define('visbug-ally', Ally)
