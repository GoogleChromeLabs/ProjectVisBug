import $ from 'blingblingjs'
import { TinyColor } from '@ctrl/tinycolor'
import { getStyle } from '../features/utils'

export function ColorPicker(pallete, selectorEngine) {
  const foregroundPicker = $('#foreground', pallete)[0]
  const backgroundPicker = $('#background', pallete)[0]

  // set colors
  foregroundPicker.on('input', e =>
    $('[data-selected=true]').map(el =>
      el.style.color = e.target.value))

  backgroundPicker.on('input', e =>
    $('[data-selected=true]').map(el =>
      el.style.backgroundColor = e.target.value))

  // read colors
  selectorEngine.onSelectedUpdate(elements => {
    if (!elements.length) return

    let isMeaningfulForeground = false
    let isMeaningfulBackground = false

    if (elements.length <= 2) {
      const FG = new TinyColor(getStyle(elements[0], 'color'))
      const BG = new TinyColor(getStyle(elements[0], 'backgroundColor'))

      let fg = FG.toHexString()
      let bg = BG.toHexString()

      isMeaningfulForeground = FG.originalInput !== 'rgb(0, 0, 0)'
      isMeaningfulBackground = BG.originalInput !== 'rgba(0, 0, 0, 0)' 

      foregroundPicker.attr('value', isMeaningfulForeground
        ? fg 
        : '')

      backgroundPicker.attr('value', isMeaningfulBackground
        ? bg 
        : '')
    }

    foregroundPicker.parentNode.style.display = !isMeaningfulForeground ? 'none' : 'block'
    backgroundPicker.parentNode.style.display = !isMeaningfulBackground ? 'none' : 'block'
  })
}