import $ from 'blingblingjs'
import { Metatip } from './metatip.element.js'
import { preferredNotation } from '../../features/color.js'
import { draggable } from '../../features/'
import { getStyle, getComputedBackgroundColor } from '../../utilities'
import { contrast_color } from '../../utilities'

export class Ally extends Metatip {
  constructor() {
    super()
    this.copyColorSwatch = this.copyColorSwatch.bind(this)
  }

  async copyToClipboard(text) {
    const {state} = await navigator.permissions.query({name:'clipboard-write'})

    if (state === 'granted')
      navigator.clipboard.writeText(text)
  }

  copyColorSwatch(event) {
    this.copyToClipboard(event.currentTarget.querySelector('span').innerText.trim())
  }

  observe() {
    $('[color-swatch]', this.$shadow).on('click', this.copyColorSwatch)

    draggable({
      el: this,
      surface: this.$shadow.querySelector('header'),
      cursor: 'grab',
    })
  }

  unobserve() {
    $('[color-swatch]', this.$shadow).off('click', this.copyColorSwatch)
  }

  render({el, ally_attributes, contrast_results}) {
    const colormode = $('vis-bug').attr('color-mode')

    const foreground = el instanceof SVGElement
      ? (getStyle(el, 'fill') || getStyle(el, 'stroke'))
      : getStyle(el, 'color')
    const background = getComputedBackgroundColor(el)

    const contrastingForegroundColor = contrast_color(foreground)
    const contrastingBackgroundColor = contrast_color(background)

    this.style.setProperty('--copy-message-left-color', contrastingForegroundColor)
    this.style.setProperty('--copy-message-right-color', contrastingBackgroundColor)

    return `
      <figure visbug-ally>
        <header>
          <h5>&#60;${el.nodeName.toLowerCase()}&#62;${el.id && '#' + el.id}</h5>
        </header>
        <section>
          <div color-swatches>
            <span color-swatch style="background-color:${foreground};" tabindex="0">
              <small style="color:${contrastingForegroundColor};">
                Foreground
              </small>
              <span style="color:${contrastingForegroundColor};">
                ${preferredNotation(foreground, colormode)}
              </span>
            </span>
            <span color-swatch style="background-color:${background};" tabindex="0">
              <small style="color:${contrastingBackgroundColor};">
                Background
              </small>
              <span style="color:${contrastingBackgroundColor};">
                ${preferredNotation(background, colormode)}
              </span>
            </span>
          </div>
          ${contrast_results}
        </section>
        ${ally_attributes.length > 0
          ? `<code accessibility>
                <div>
                  ${ally_attributes.reduce((items, attr) => `
                    ${items}
                    <span prop>${attr.prop}:</span>
                    <span value>${attr.value}</span>
                  `, '')}
                </div>
              </code>`
          : ''
        }

      </figure>
    `
  }
}

customElements.define('visbug-ally', Ally)
