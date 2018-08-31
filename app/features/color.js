import $ from 'blingblingjs'
import { TinyColor } from '@ctrl/tinycolor'
import { getStyle } from '../features/utils'

export function ColorPicker(pallete, selectorEngine) {
  const foregroundPicker  = $('#foreground', pallete)
  const backgroundPicker  = $('#background', pallete)
  const borderPicker      = $('#border', pallete)
  const fgInput           = $('input', foregroundPicker[0])
  const bgInput           = $('input', backgroundPicker[0])
  const boInput           = $('input', borderPicker[0])

  // set colors
  fgInput.on('input', e =>
    $('[data-selected=true]').map(el =>
      el.style['color'] = e.target.value))

  bgInput.on('input', e =>
    $('[data-selected=true]').map(el =>
      el.style[el instanceof SVGElement
        ? 'fill'
        : 'backgroundColor'
      ] = e.target.value))

  boInput.on('input', e =>
    $('[data-selected=true]').map(el =>
      el.style[el instanceof SVGElement
        ? 'stroke'
        : 'border-color'
      ] = e.target.value))

  // read colors
  selectorEngine.onSelectedUpdate(elements => {
    if (!elements.length) return

    let isMeaningfulForeground = false
    let isMeaningfulBackground = false
    let isMeaningfulBorder = false
    let FG, BG, BO

    if (elements.length <= 2) {
      const el = elements[0]

      if (el instanceof SVGElement) {
        FG = new TinyColor('rgb(0, 0, 0)')
        var bo_temp = getStyle(el, 'stroke')
        BO = new TinyColor(bo_temp === 'none'
          ? 'rgb(0, 0, 0)'
          : bo_temp)
        BG = new TinyColor(getStyle(el, 'fill'))
      }
      else {
        FG = new TinyColor(getStyle(el, 'color'))
        BG = new TinyColor(getStyle(el, 'backgroundColor'))
        BO = getStyle(el, 'borderWidth') === '0px'
          ? new TinyColor('rgb(0, 0, 0)')
          : new TinyColor(getStyle(el, 'borderColor'))
      }

      let fg = FG.toHexString()
      let bg = BG.toHexString()
      let bo = BO.toHexString()

      isMeaningfulForeground = FG.originalInput !== 'rgb(0, 0, 0)' || (el.children.length === 0 && el.textContent !== '')
      isMeaningfulBackground = BG.originalInput !== 'rgba(0, 0, 0, 0)' 
      isMeaningfulBorder     = BO.originalInput !== 'rgb(0, 0, 0)' 

      const new_fg = isMeaningfulForeground ? fg : ''
      const new_bg = isMeaningfulBackground ? bg : ''
      const new_bo = isMeaningfulBorder ? bo : ''

      fgInput.attr('value', new_fg)
      bgInput.attr('value', new_bg)
      boInput.attr('value', new_bo)
      
      foregroundPicker.attr('style', `
        --contextual_color: ${new_fg};
        display: ${!isMeaningfulForeground ? 'none' : 'inline-flex'};
      `)

      backgroundPicker.attr('style', `
        --contextual_color: ${new_bg};
        display: ${!isMeaningfulBackground ? 'none' : 'inline-flex'};
      `)

      borderPicker.attr('style', `
        --contextual_color: ${new_bo};
        display: ${!isMeaningfulBorder ? 'none' : 'inline-flex'};
      `)
    }
  })
}