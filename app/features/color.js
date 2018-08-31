import $ from 'blingblingjs'
import { TinyColor } from '@ctrl/tinycolor'
import { getStyle } from '../features/utils'

export function ColorPicker(pallete, selectorEngine) {
  const foregroundPicker  = $('#foreground', pallete)
  const fgInput           = $('input', foregroundPicker[0])
  const backgroundPicker  = $('#background', pallete)
  const bgInput           = $('input', backgroundPicker[0])

  // set colors
  fgInput.on('input', e =>
    $('[data-selected=true]').map(el =>
      el.style[el instanceof SVGElement
        ? 'stroke'
        : 'color'
      ] = e.target.value))

  bgInput.on('input', e =>
    $('[data-selected=true]').map(el =>
      el.style[el instanceof SVGElement
        ? 'fill'
        : 'backgroundColor'
      ] = e.target.value))

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

      const new_fg = isMeaningfulForeground ? fg : ''
      const new_bg = isMeaningfulBackground ? bg : ''

      fgInput.attr('value', new_fg)
      bgInput.attr('value', new_bg)
      
      foregroundPicker.attr('style', `
        --contextual_color: ${new_fg};
        display: ${!isMeaningfulForeground ? 'none' : 'inline-flex'};
      `)

      backgroundPicker.attr('style', `
        --contextual_color: ${new_bg};
        display: ${!isMeaningfulBackground ? 'none' : 'inline-flex'};
      `)
    }
  })
}