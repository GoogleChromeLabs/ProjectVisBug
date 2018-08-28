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
    let FG, BG

    if (elements.length <= 2) {
      const el = elements[0]

      if (el instanceof SVGElement) {
        var fg_temp = getStyle(el, 'stroke')
        FG = new TinyColor(fg_temp === 'none'
          ? 'rgb(0, 0, 0)'
          : fg_temp)
        BG = new TinyColor(getStyle(el, 'fill'))
      }
      else {
        FG = new TinyColor(getStyle(el, 'color'))
        BG = new TinyColor(getStyle(el, 'backgroundColor'))
      }

      let fg = FG.toHexString()
      let bg = BG.toHexString()

      isMeaningfulForeground = FG.originalInput !== 'rgb(0, 0, 0)' || (el.children.length === 0 && el.textContent !== '')
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