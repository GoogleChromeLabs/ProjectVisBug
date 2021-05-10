import $ from 'blingblingjs'
import { Metatip } from './metatip.element.js'
// import { Selectable } from '../../features/'

export class Ally extends Metatip {
  constructor() {
    super()
    // Selectable($('[color-swatch]', this.$shadow))
  }

  copyToClipboard(text, callback) {
    try {
      var temp = document.createElement('textarea');
      document.body.append(temp);
      temp.value = text;
      temp.select();
      document.execCommand('copy');
      temp.remove();
      if (callback) callback(text);
    } catch (err) {
      alert(
        'Could not automatically copy to clipboard. \n\n Copy this text instead: \n\n' +
          text
      );
    }
  }

  clipboardMessage() {
    alert('Supposed to copy to clipboard but getting error.');
  }

  copyColorSwatch(event) {
    this.copyToClipboard(event.target.querySelector('span').innerText.trim(), this.clipboardMessage)
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
