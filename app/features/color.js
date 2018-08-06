import $ from 'blingblingjs'
import { TinyColor } from '@ctrl/tinycolor'
import { getStyle } from '../features/utils'

export function ColorPicker(pallete, selectorEngine) {
  const foregroundPicker = $('#foreground', pallete)[0]
  const backgroundPicker = $('#background', pallete)[0]

  // set colors
  foregroundPicker.on('input', e =>
    ChangeForeground($('[data-selected=true]', pallete), e.target.value))

  backgroundPicker.on('input', e =>
    ChangeBackground($('[data-selected=true]', pallete), e.target.value))

  // read colors
  selectorEngine.onSelectedUpdate(elements => {
    if (!elements.length) return

    if (elements.length >= 2) {
      foregroundPicker.value = null
      backgroundPicker.value = null
    }
    else {
      const FG = new TinyColor(getStyle(elements[0], 'color'))
      const BG = new TinyColor(getStyle(elements[0], 'backgroundColor'))

      let fg = '#' + FG.toHex()
      let bg = '#' + BG.toHex()

      foregroundPicker.attr('value', (FG.originalInput == 'rgb(0, 0, 0)' && elements[0].textContent == '') ? '' : fg)
      backgroundPicker.attr('value', BG.originalInput == 'rgba(0, 0, 0, 0)' ? '' : bg)
    }
  })
}

function changeForeground(elements, color) {
  elements.map(el =>
    el.style.color = color)
}

function changeBackground(elements, color) {
  elements.map(el =>
    el.style.backgroundColor = color)
}